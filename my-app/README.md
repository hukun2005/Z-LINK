# Z-LINK

面向工业制造的企业供需智能匹配平台。用户以自然语言描述采购需求，平台通过语义检索从供应商库中筛选最匹配的企业，并由本地大模型流式生成推荐理由；同时提供供应商浏览、需求发布、消息与通知中心等完整采购协同能力。

## 功能特性

- **用户登录与受保护路由**：登录 / 注册、token 鉴权、全局导航守卫控制页面访问权限
- **AI 企业匹配助手**：自然语言需求 → 语义检索 Top 3 候选企业 → 本地大模型流式生成推荐理由（SSE）
- **供应商库**：企业信息浏览（名称、主营产品、简介、标签）
- **需求发布**：发布采购需求，自动生成通知
- **消息中心**：联系人对话、未读数、模拟回复
- **通知中心**：通知列表、未读数、单条已读 / 全部已读
- **主题切换**：亮色 / 暗色主题

## 技术栈

**前端（my-app）**

- Vue 3（Composition API + `<script setup>`）
- TypeScript
- Vite 8
- Pinia（登录态、主题状态管理）
- Vue Router 4（登录守卫）
- Ant Design Vue 4 + Tailwind CSS 4
- Axios（请求 / 响应拦截器）

**后端（backend）**

- FastAPI + Uvicorn
- SQLite（需求、通知、消息）
- Ollama（本地大模型 mistral-nemo，可选嵌入模型 nomic-embed-text）

## 目录结构

```text
智配通
├── my-app/                    # 前端（Vue 3）
│   ├── src/
│   │   ├── api/               # 接口封装（登录、供应商、需求、AI、消息、通知）
│   │   ├── page/              # 页面（Home / Login / Companies / Publish / Profile / assistant / NotFound）
│   │   ├── router/            # 路由与登录守卫
│   │   ├── shared/            # Header、Container 等公共组件
│   │   ├── store/             # Pinia 状态（登录态、主题）
│   │   └── utils/             # axios 请求封装
│   ├── .env.development       # 接口地址（VITE_API_URL）
│   └── package.json
└── backend/                   # 后端（FastAPI）
    ├── main.py                # 接口入口（登录、供应商、需求、通知、消息、AI 对话）
    ├── matcher.py             # 企业检索匹配器（语义向量 / 关键词兜底）
    ├── db.py                  # SQLite 数据访问（需求、通知、消息）
    ├── requirements.txt
    ├── 启动后端.bat            # Windows 启动脚本
    └── data/                  # suppliers.json 供应商数据 + SQLite 数据库
```

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com)：需要本地启动并拉取模型 `ollama pull mistral-nemo`
  - 如本地已安装嵌入模型 `ollama pull nomic-embed-text`，匹配器会自动启用语义向量检索；未安装则自动降级为关键词检索，不影响使用

### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Windows 下也可直接双击 `backend/启动后端.bat`。启动后可访问接口文档：<http://localhost:8000/docs>

### 2. 启动前端

```bash
cd my-app
npm install
npm run dev
```

启动后访问终端中显示的本地地址（默认 <http://localhost:5173>）。

### 环境变量

前端通过 `.env.development` 配置后端地址，默认已配置为：

```bash
VITE_API_URL=http://localhost:8000
```

### 内置账号

| 用户名 | 密码     |
| ------ | -------- |
| hk     | 12345678 |

## AI 匹配流程

1. 后端启动时加载 `data/suppliers.json` 供应商数据，尝试通过 Ollama 嵌入模型（nomic-embed-text）为每家企业构建语义向量索引；若嵌入模型未安装，则退化为零依赖的中文关键词索引（标签整体加权 + 中文二元词组 + 英文数字词，余弦相似度）
2. 用户输入自然语言需求后，对需求做向量化 / 分词，与供应商库计算余弦相似度，返回 Top 3 候选企业
3. 前端通过 SSE 依次接收 `matches` 事件（展示候选企业与匹配度）与 `delta` 事件（流式渲染大模型生成的推荐理由，基于候选企业做到 RAG，不编造公司）

## API 一览

| 方法 | 路径                     | 说明                         |
| ---- | ------------------------ | ---------------------------- |
| POST | `/login`                 | 登录，返回签名 token         |
| GET  | `/suppliers`             | 供应商列表                   |
| GET  | `/api/health`            | 后端与 Ollama 状态           |
| POST | `/api/chat`              | 企业匹配 + 流式对话（SSE）   |
| POST | `/requirements`          | 发布采购需求                 |
| GET  | `/requirements`          | 已发布需求列表               |
| GET  | `/notifications`         | 通知列表（含未读数）         |
| PATCH| `/notifications/{id}/read`| 标记单条已读                |
| POST | `/notifications/read-all`| 全部已读                     |
| GET  | `/messages/contacts`     | 联系人列表                   |
| GET  | `/messages`              | 与某联系人的对话记录         |
| POST | `/messages`              | 发送消息                     |

## 许可证

项目依赖及模型文件请分别遵循其各自的许可证和使用条款。