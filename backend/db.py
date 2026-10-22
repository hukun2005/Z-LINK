"""SQLite 数据库模块

负责需求表的建表、迁移、增删查。
数据库文件：data/zhipeitong.db
"""

import json
import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "zhipeitong.db"
LEGACY_JSON = Path(__file__).parent / "data" / "requirements.json"


def _connect() -> sqlite3.Connection:
    """每次操作开一个连接，简单安全"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # 查询结果可按字段名取值
    return conn


def init_db():
    """建表；若表为空且存在旧 JSON 数据，则自动迁移"""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS requirement (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                title          TEXT    NOT NULL,
                category       TEXT    NOT NULL,
                description    TEXT    NOT NULL,
                quantity       INTEGER,
                unit           TEXT,
                budget         REAL,
                deadline       TEXT,
                qualifications TEXT    DEFAULT '[]',
                contact        TEXT    NOT NULL,
                phone          TEXT    NOT NULL,
                publisher      TEXT    NOT NULL,
                status         TEXT    NOT NULL DEFAULT '待匹配',
                created_at     TEXT    NOT NULL
            )
            """
        )

        # 迁移：表为空且存在旧 JSON 文件时，把数据导入进来
        count = conn.execute("SELECT COUNT(*) FROM requirement").fetchone()[0]
        if count == 0 and LEGACY_JSON.exists():
            records = json.loads(LEGACY_JSON.read_text(encoding="utf-8"))
            for r in records:
                conn.execute(
                    "INSERT INTO requirement "
                    "(id, title, category, description, quantity, unit, "
                    "budget, deadline, qualifications, contact, phone, "
                    "publisher, status, created_at) "
                    "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    (
                        r["id"], r["title"], r["category"], r["description"],
                        r.get("quantity"), r.get("unit"), r.get("budget"),
                        r.get("deadline"),
                        json.dumps(r.get("qualifications", []), ensure_ascii=False),
                        r["contact"], r["phone"], r["publisher"],
                        r.get("status", "待匹配"), r["created_at"],
                    ),
                )

        # 通知表
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notification (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                type       TEXT    NOT NULL DEFAULT 'system',
                title      TEXT    NOT NULL,
                content    TEXT    NOT NULL,
                is_read    INTEGER NOT NULL DEFAULT 0,
                created_at TEXT    NOT NULL
            )
            """
        )
        # 首次运行时插入欢迎通知
        ncount = conn.execute("SELECT COUNT(*) FROM notification").fetchone()[0]
        if ncount == 0:
            now = time.strftime("%Y-%m-%d %H:%M:%S")
            seeds = [
                ("system", "欢迎使用智链采", "您的账号已激活，可以开始发布采购需求或使用AI助手匹配供应商。", now),
                ("system", "供应商库已就绪", f"系统已加载{conn.execute('SELECT COUNT(*) FROM requirement').fetchone()[0]}条需求记录和17家认证供应商数据。", now),
            ]
            for s in seeds:
                conn.execute(
                    "INSERT INTO notification (type, title, content, created_at) "
                    "VALUES (?,?,?,?)",
                    s,
                )

        # 消息表（联系人对话）
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS message (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                contact    TEXT    NOT NULL,
                role       TEXT    NOT NULL,
                content    TEXT    NOT NULL,
                is_read    INTEGER NOT NULL DEFAULT 0,
                created_at TEXT    NOT NULL
            )
            """
        )
        # 首次运行时插入示例对话
        mcount = conn.execute("SELECT COUNT(*) FROM message").fetchone()[0]
        if mcount == 0:
            now = time.strftime("%Y-%m-%d %H:%M:%S")
            demo = [
                ("华东精密机械·张经理", "them", "您好！看到贵司发布的精密机加工需求，我们非常匹配，月产能可达50万件。", 0),
                ("华东精密机械·张经理", "me", "你好，我们预计下月下单，CNC加工件的数量大概是2万件左右。", 1),
                ("华东精密机械·张经理", "them", "没问题，我可以把详细报价单和设备清单发给您，方便加个联系方式详聊吗？", 0),
                ("南方模具制造厂·李主管", "them", "您好，我们是30年经验的模具厂，注塑/冲压模具都可以做，欢迎咨询。", 0),
                ("南方模具制造厂·李主管", "me", "你好，我们需要注塑模具10套，交期2个月，能做吗？", 1),
                ("南方模具制造厂·李主管", "them", "可以，10套注塑模具交期完全来得及，稍后我把排产计划发您。", 0),
            ]
            for c in demo:
                conn.execute(
                    "INSERT INTO message (contact, role, content, is_read, created_at) "
                    "VALUES (?,?,?,?,?)",
                    (*c, now),
                )


def insert_requirement(data: dict) -> dict:
    """插入一条需求，返回完整记录"""
    created_at = time.strftime("%Y-%m-%d %H:%M:%S")
    with _connect() as conn:
        cursor = conn.execute(
            "INSERT INTO requirement "
            "(title, category, description, quantity, unit, budget, "
            "deadline, qualifications, contact, phone, publisher, "
            "status, created_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                data["title"], data["category"], data["description"],
                data.get("quantity"), data.get("unit"), data.get("budget"),
                data.get("deadline"),
                json.dumps(data.get("qualifications", []), ensure_ascii=False),
                data["contact"], data["phone"], data["publisher"],
                "待匹配", created_at,
            ),
        )
        new_id = cursor.lastrowid
    return _row_to_dict(_get_by_id(new_id))


def list_requirements() -> list[dict]:
    """返回全部需求，最新发布排在前面"""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM requirement ORDER BY id DESC"
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


def _get_by_id(req_id: int) -> sqlite3.Row | None:
    with _connect() as conn:
        return conn.execute(
            "SELECT * FROM requirement WHERE id = ?", (req_id,)
        ).fetchone()


def _row_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    d = dict(row)
    d["qualifications"] = json.loads(d.get("qualifications") or "[]")
    return d


# ==================== 通知 ====================

def insert_notification(ntype: str, title: str, content: str) -> dict:
    """插入一条通知，返回完整记录"""
    created_at = time.strftime("%Y-%m-%d %H:%M:%S")
    with _connect() as conn:
        cursor = conn.execute(
            "INSERT INTO notification (type, title, content, created_at) "
            "VALUES (?,?,?,?)",
            (ntype, title, content, created_at),
        )
        new_id = cursor.lastrowid
    return _notif_to_dict(_get_notif_by_id(new_id))


def list_notifications() -> list[dict]:
    """返回全部通知，最新在前"""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM notification ORDER BY id DESC"
        ).fetchall()
    return [_notif_to_dict(r) for r in rows]


def mark_notification_read(notif_id: int) -> bool:
    """标记单条已读，返回是否成功"""
    with _connect() as conn:
        cursor = conn.execute(
            "UPDATE notification SET is_read = 1 WHERE id = ?",
            (notif_id,),
        )
        return cursor.rowcount > 0


def mark_all_read() -> int:
    """全部标记已读，返回影响行数"""
    with _connect() as conn:
        cursor = conn.execute(
            "UPDATE notification SET is_read = 1 WHERE is_read = 0"
        )
        return cursor.rowcount


def count_unread() -> int:
    with _connect() as conn:
        return conn.execute(
            "SELECT COUNT(*) FROM notification WHERE is_read = 0"
        ).fetchone()[0]


def _get_notif_by_id(notif_id: int) -> sqlite3.Row | None:
    with _connect() as conn:
        return conn.execute(
            "SELECT * FROM notification WHERE id = ?", (notif_id,)
        ).fetchone()


def _notif_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    d = dict(row)
    d["is_read"] = bool(d["is_read"])
    return d


# ==================== 联系人消息 ====================

def list_contacts() -> list[dict]:
    """联系人列表：每个联系人的最后一条消息 + 对方消息未读数"""
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT m.contact,
                   (SELECT content FROM message WHERE contact = m.contact
                     ORDER BY id DESC LIMIT 1) AS last_content,
                   (SELECT role FROM message WHERE contact = m.contact
                     ORDER BY id DESC LIMIT 1) AS last_role,
                   (SELECT created_at FROM message WHERE contact = m.contact
                     ORDER BY id DESC LIMIT 1) AS last_time,
                   SUM(CASE WHEN m.role = 'them' AND m.is_read = 0
                       THEN 1 ELSE 0 END) AS unread
            FROM message m
            GROUP BY m.contact
            ORDER BY last_time DESC
            """
        ).fetchall()
    return [dict(r) for r in rows]


def list_messages(contact: str) -> list[dict]:
    """与某联系人的全部对话，按时间正序"""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM message WHERE contact = ? ORDER BY id",
            (contact,),
        ).fetchall()
    return [_msg_to_dict(r) for r in rows]


def send_message(contact: str, content: str) -> dict:
    """保存我方发出的消息，并模拟对方自动回复"""
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    with _connect() as conn:
        cursor = conn.execute(
            "INSERT INTO message (contact, role, content, is_read, created_at) "
            "VALUES (?,?,?,?,?)",
            (contact, "me", content, 1, now),
        )
        my_id = cursor.lastrowid
        # 模拟对方回复
        reply = f"已收到您的消息：「{content[:20]}」我们会尽快跟进并给您答复。"
        conn.execute(
            "INSERT INTO message (contact, role, content, is_read, created_at) "
            "VALUES (?,?,?,?,?)",
            (contact, "them", reply, 0, now),
        )
    row = _get_msg_by_id(my_id)
    return _msg_to_dict(row)


def mark_contact_read(contact: str) -> int:
    """把某联系人发来的消息全部标记已读"""
    with _connect() as conn:
        cursor = conn.execute(
            "UPDATE message SET is_read = 1 "
            "WHERE contact = ? AND role = 'them' AND is_read = 0",
            (contact,),
        )
        return cursor.rowcount


def count_contact_unread() -> int:
    with _connect() as conn:
        return conn.execute(
            "SELECT COUNT(*) FROM message WHERE role = 'them' AND is_read = 0"
        ).fetchone()[0]


def _get_msg_by_id(msg_id: int) -> sqlite3.Row | None:
    with _connect() as conn:
        return conn.execute(
            "SELECT * FROM message WHERE id = ?", (msg_id,)
        ).fetchone()


def _msg_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    d = dict(row)
    d["is_read"] = bool(d["is_read"])
    return d
