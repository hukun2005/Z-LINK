"""智链采 Z-Link 后端

FastAPI + 本地 Ollama(mistral-nemo)。

接口：
  POST /login          登录，返回签名 token
  GET  /suppliers      供应商列表
  GET  /api/health     后端与 Ollama 状态
  POST /api/chat       企业匹配 + 流式对话（SSE）
  POST /requirements   发布采购需求（自动生成通知）
  GET  /requirements   已发布需求列表
  GET  /notifications       通知列表（含 unread 未读数）
  PATCH /notifications/{id}/read  标记单条已读
  POST /notifications/read-all    全部已读
  GET  /messages/contacts   联系人列表（最后消息+未读数）
  GET  /messages?contact=x  与某联系人的对话记录
  POST /messages            发送消息（对方自动回复）
  POST /messages/contact/read     标记某联系人消息已读

启动：
  python -m uvicorn main:app --host 0.0.0.0 --port 8000
"""

import base64
import hashlib
import hmac
import json
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from matcher import Matcher
import db

# ---------------- 配置（可用环境变量覆盖） ----------------
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral-nemo")
# 嵌入模型为可选项：未安装时自动退化为关键词检索，不影响使用
EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text") or None
AUTH_SECRET = os.getenv("AUTH_SECRET", "zlink-zhipetong-secret-2026")
TOKEN_TTL = 7 * 24 * 3600

# 内置用户（与前端 mock 保持一致：hk / 12345678）
USERS = {
    "hk": {"password": "12345678", "name": "赵铁柱"},
}

# 按钮权限标识，登录后返回给前端
BTN_AUTH = ["assistant", "companies", "publish", "profile"]

SYSTEM_PROMPT = (
    "你是“智链采 Z-Link”平台的工业供应商匹配助手。系统已根据用户需求检索出若干候选供应商。"
    "请基于候选企业信息，用简体中文回答用户，说明哪些企业最匹配，以及它们的能力、资质、产品为何符合需求"
    "（可结合每家公司的“匹配要点”说明）。"
    "要求：1.只能依据提供的候选企业作答，不得编造公司；"
    "2.不要换行，不要使用Markdown列表或标题，用一段连贯的文字表述，可用分号和句号分隔；"
    "3.简洁专业，200字以内。若候选企业确实与需求无关，请如实说明并建议用户细化需求。"
)


# ---------------- 简易签名 Token ----------------
def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def create_token(username: str) -> str:
    payload = {"sub": username, "exp": int(time.time()) + TOKEN_TTL}
    body = _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(AUTH_SECRET.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{body}.{sig}"


def verify_token(token: str) -> str | None:
    try:
        body, sig = token.split(".", 1)
        expect = hmac.new(AUTH_SECRET.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expect):
            return None
        payload = json.loads(_b64url_decode(body))
        if int(payload["exp"]) < int(time.time()):
            return None
        return str(payload["sub"])
    except Exception:
        return None


async def current_user(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    username = verify_token(token)
    if not username or username not in USERS:
        raise HTTPException(status_code=401, detail="未登录或登录已过期")
    return username


# ---------------- 请求模型 ----------------
class LoginIn(BaseModel):
    username: str
    password: str


class ChatIn(BaseModel):
    message: str
    top_k: int = 3


class RequirementIn(BaseModel):
    title: str
    category: str
    description: str
    quantity: int | None = None
    unit: str | None = None
    budget: float | None = None
    deadline: str | None = None  # 期望交货日期，格式 YYYY-MM-DD
    qualifications: list[str] = []
    contact: str
    phone: str


# ---------------- 启动：加载数据并构建索引 ----------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    data_dir = Path(__file__).parent / "data"
    companies = json.loads((data_dir / "suppliers.json").read_text(encoding="utf-8"))
    app.state.companies = companies
    app.state.matcher = await Matcher.create(companies, OLLAMA_URL, EMBED_MODEL)

    # 初始化 SQLite 数据库（首次运行自动建表并迁移旧 JSON 数据）
    db.init_db()
    yield


app = FastAPI(title="智链采 Z-Link API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def sse(event: str, data: str) -> str:
    return f"event: {event}\ndata: {data}\n\n"


# ---------------- 业务接口 ----------------
@app.post("/login")
async def login(body: LoginIn):
    user = USERS.get(body.username)
    if not user or user["password"] != body.password:
        return JSONResponse(
            status_code=401,
            content={"code": 401, "message": "用户名或密码错误", "data": None},
        )
    return {
        "code": 200,
        "message": "登录成功",
        "data": {
            "username": user["name"],
            "token": create_token(body.username),
            "btnAuth": BTN_AUTH,
        },
    }


@app.get("/suppliers")
async def suppliers(request: Request, _: str = Depends(current_user)):
    return {"code": 200, "message": "请求成功", "data": request.app.state.companies}


@app.get("/suppliers/{sid}")
async def supplier_detail(sid: int, request: Request, _: str = Depends(current_user)):
    """供应商详情，供前端详情页单查"""
    for company in request.app.state.companies:
        if company.get("id") == sid:
            return {"code": 200, "message": "请求成功", "data": company}
    raise HTTPException(status_code=404, detail="供应商不存在")


@app.post("/requirements")
async def publish_requirement(
    body: RequirementIn, request: Request, username: str = Depends(current_user)
):
    record = db.insert_requirement({
        **body.model_dump(),
        "publisher": USERS[username]["name"],
    })
    # 自动生成通知
    db.insert_notification(
        "requirement",
        "需求发布成功",
        f"您发布的需求「{body.title}」已提交，品类：{body.category}，"
        f"系统正在为您匹配合适的供应商。",
    )
    return {"code": 200, "message": "需求发布成功", "data": record}


@app.get("/requirements")
async def list_requirements(request: Request, _: str = Depends(current_user)):
    data = db.list_requirements()
    return {"code": 200, "message": "请求成功", "data": data}


# ---------------- 通知接口 ----------------
@app.get("/notifications")
async def list_notifications(request: Request, _: str = Depends(current_user)):
    data = db.list_notifications()
    unread = db.count_unread()
    return {"code": 200, "message": "请求成功", "data": data, "unread": unread}


@app.patch("/notifications/{notif_id}/read")
async def read_notification(notif_id: int, _: str = Depends(current_user)):
    ok = db.mark_notification_read(notif_id)
    if not ok:
        raise HTTPException(status_code=404, detail="通知不存在")
    return {"code": 200, "message": "已标记为已读", "data": None}


@app.post("/notifications/read-all")
async def read_all_notifications(_: str = Depends(current_user)):
    n = db.mark_all_read()
    return {"code": 200, "message": f"已将 {n} 条通知标记为已读", "data": None}


# ---------------- 联系人消息接口 ----------------
@app.get("/messages/contacts")
async def contacts(_: str = Depends(current_user)):
    data = db.list_contacts()
    unread = db.count_contact_unread()
    return {"code": 200, "message": "请求成功", "data": data, "unread": unread}


@app.get("/messages")
async def messages(contact: str, _: str = Depends(current_user)):
    data = db.list_messages(contact)
    return {"code": 200, "message": "请求成功", "data": data}


@app.post("/messages")
async def send_message(body: dict, _: str = Depends(current_user)):
    contact = (body.get("contact") or "").strip()
    content = (body.get("content") or "").strip()
    if not contact or not content:
        raise HTTPException(status_code=422, detail="联系人和内容不能为空")
    record = db.send_message(contact, content)
    return {"code": 200, "message": "发送成功", "data": record}


@app.post("/messages/contact/read")
async def read_contact_messages(body: dict, _: str = Depends(current_user)):
    contact = (body.get("contact") or "").strip()
    if not contact:
        raise HTTPException(status_code=422, detail="联系人不能为空")
    n = db.mark_contact_read(contact)
    return {"code": 200, "message": f"已读 {n} 条消息", "data": None}


@app.get("/api/health")
async def health(request: Request, _: str = Depends(current_user)):
    ollama_online = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{OLLAMA_URL}/api/tags")
            ollama_online = res.status_code == 200
    except Exception:
        pass

    matcher: Matcher = request.app.state.matcher
    return {
        "code": 200,
        "message": "ok",
        "data": {
            "model": OLLAMA_MODEL,
            "index_size": matcher.size,
            "retriever": matcher.mode,
            "embed_model": matcher.embed_model,
            "ollama_online": ollama_online,
        },
    }


async def chat_stream(request: Request, message: str, top_k: int):
    matcher: Matcher = request.app.state.matcher

    # 1) 检索匹配企业
    matches = await matcher.search(message, top_k)
    yield sse("matches", json.dumps(matches, ensure_ascii=False))

    # 2) 组装 RAG 上下文
    if matches:
        lines = [
            f"{i}. 公司名称：{m['name']}；主营产品：{m['product']}；"
            f"简介：{m['describe']}；标签：{'、'.join(m['tags'])}；"
            f"匹配要点：{'、'.join(m.get('reason') or []) or '综合匹配'}"
            for i, m in enumerate(matches, 1)
        ]
        context = "\n".join(lines)
    else:
        context = "（未检索到候选企业）"

    ollama_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"检索到的候选供应商：\n{context}\n\n用户需求：{message}",
        },
    ]

    # 3) 流式调用 mistral-nemo，逐块转发 delta
    try:
        timeout = httpx.Timeout(connect=10.0, read=None, write=10.0, pool=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": ollama_messages,
                    "stream": True,
                },
            ) as resp:
                if resp.status_code != 200:
                    body = (await resp.aread()).decode("utf-8", errors="ignore")
                    yield sse("error", f"模型服务返回错误({resp.status_code})：{body[:200]}")
                    return

                async for line in resp.aiter_lines():
                    if await request.is_disconnected():
                        break
                    if not line.strip():
                        continue
                    chunk = json.loads(line)
                    text = chunk.get("message", {}).get("content", "")
                    if text:
                        # 前端 SSE 解析器无法承载裸换行，统一去除（提示词已要求不换行）
                        text = text.replace("\r", "").replace("\n", "")
                        if text:
                            yield sse("delta", text)
                    if chunk.get("done"):
                        break
    except httpx.ConnectError:
        yield sse("error", "无法连接 Ollama，请确认已启动 ollama serve 且已下载 mistral-nemo")
    except Exception as exc:  # noqa: BLE001
        yield sse("error", f"生成失败：{exc}")


@app.post("/api/chat")
async def chat(body: ChatIn, request: Request, _: str = Depends(current_user)):
    top_k = max(1, min(body.top_k, 10))
    return StreamingResponse(
        chat_stream(request, body.message, top_k),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# 直接运行本文件即可启动服务（PyCharm 里点绿色运行按钮 = 执行这里）
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
