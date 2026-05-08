# AI 智能对话助手（Vue + Node + MySQL）

这是一个可继续迭代到面试/上线方向的 AI 对话项目，当前由两部分组成：

- `src/`：前端（Vue 3 + TypeScript + Pinia + Element Plus）
- `server/`：后端网关（Express + MySQL），负责：
  - 转发 Spark 大模型流式请求（避免浏览器 CORS）
  - 服务端持有密钥（避免前端暴露 APIpassword）
  - 持久化聊天状态到 MySQL（可用 Navicat 管理）

## 一、项目能力

- 实时流式对话（SSE chunk 增量渲染）
- 多会话管理（新增/切换/删除）
- 角色设定（system prompt 注入）
- Markdown + 代码高亮
- 本地缓存 + 远端数据库双持久化
- 前后端解耦，具备后续扩展基础

## 二、目录结构

```text
ai-chat-assistant/
├─ src/                     # 前端源码
├─ server/                  # 后端服务
│  ├─ src/
│  │  ├─ index.js           # API 入口（health/state/chat stream）
│  │  ├─ db.js              # MySQL 连接与初始化
│  │  ├─ sparkClient.js     # Spark 流式请求封装
│  │  └─ stateRepository.js # 会话状态持久化
│  ├─ sql/schema.sql        # 数据库初始化脚本
│  └─ .env.example          # 后端环境变量示例
├─ .env.example             # 前端环境变量示例
└─ vite.config.ts           # 前端 dev proxy（/api -> localhost:3000）
```

## 三、环境准备

- Node.js 18+（建议 LTS）
- MySQL 8.x（或兼容版本）
- 已开通讯飞 Spark HTTP 接口（拿到 APIpassword）

## 四、数据库初始化（Navicat 可操作）

你可以直接在 Navicat 执行 `server/sql/schema.sql`，或者命令行执行：

```sql
CREATE DATABASE IF NOT EXISTS ai_chat_assistant
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ai_chat_assistant;

CREATE TABLE IF NOT EXISTS app_state (
  state_key VARCHAR(64) PRIMARY KEY,
  state_json JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 五、环境变量配置

### 1) 前端 `.env`

在项目根目录创建 `.env`（可复制 `.env.example`）：

```env
VITE_BACKEND_API_BASE_URL=/api
VITE_AI_MODEL=spark-x
```

### 2) 后端 `server/.env`

在 `server/` 下创建 `.env`（可复制 `server/.env.example`）：

```env
SERVER_PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_chat_assistant

SPARK_API_PASSWORD=your_spark_http_apipassword
SPARK_BASE_URL=https://spark-api-open.xf-yun.com/x2
SPARK_MODEL=spark-x
```

> 注意：密钥只放在 `server/.env`，不要再放到前端 `VITE_` 变量中。

## 六、启动方式

首次安装依赖：

```bash
npm install
npm install --prefix server
```

开发模式（推荐，一条命令启动前后端）：

```bash
npm run dev:full
```

也可分开启动：

```bash
npm run dev:server
npm run dev:client
```

访问：

- 前端：`http://localhost:5173`（端口冲突时会自动切换）
- 后端健康检查：`http://localhost:3000/api/health`

## 七、请求链路说明（解决 CORS 的关键）

发送消息时，链路如下：

1. 浏览器请求同源地址：`/api/chat/stream`
2. Vite 开发服务器将 `/api` 转发到 `http://localhost:3000`
3. Node 后端携带 `SPARK_API_PASSWORD` 请求 Spark：
   `https://spark-api-open.xf-yun.com/x2/chat/completions`
4. Spark 返回流式数据
5. 后端原样透传流式数据给前端
6. 前端逐段解析 `data:` 内容并更新 UI

这样浏览器不再直接跨域请求 Spark，CORS 问题自然消失。

## 八、接口清单（后端）

- `GET /api/health`：健康检查
- `GET /api/state`：读取持久化聊天状态
- `PUT /api/state`：保存聊天状态
- `POST /api/chat/stream`：代理 Spark 流式对话

## 九、你后续可以继续做的优化（已记录）

后续建议按照下面顺序推进，我会按这条路线继续帮你实施：

1. **状态持久化升级**：从“整块 state JSON”拆成标准化表（会话表 + 消息表）
2. **用户体系**：登录鉴权、每用户隔离会话
3. **可观测性**：请求链路日志、耗时指标、错误分级
4. **生成控制**：停止生成（Abort）、重试、超时与熔断
5. **性能优化**：消息虚拟列表、Markdown 渲染缓存、按需分包
6. **测试体系**：store 单测、流式解析测试、端到端 E2E

---

如果你要开始下一阶段，我建议先做第 1 步（会话/消息表结构化），然后再加用户体系。这样能最快把项目从“作品”升级到“工程化项目”。
