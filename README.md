# ai智能对话助手

本仓库包含一个前端（Vite + Vue）、后端 Node 服务和 Python 辅助服务的示例项目。

## 项目概览
- 前端：位于 `front/`，使用 Vite + Vue + TypeScript。
- 后端（Node）：位于 `backend/server/`，包含 Node.js 服务代码和 SQL 模式。
- 后端（Python）：位于 `backend/pyserver/`，包含 Python 服务及其依赖（例如用于数据处理或调度的脚本）。

## 目录结构

```
backend/
  pyserver/
    app/
      __init__.py
      config.py
      db.py
      main.py
      spark_client.py
      state_repo.py
    requirements.txt
  server/
    package.json
    src/
      index.js
      db.js
      sparkClient.js
      stateRepository.js
    sql/
      schema.sql
front/
  package.json
  src/
    App.vue
    main.ts
    api/
    components/
    stores/
    views/
  vite.config.ts
  tsconfig.json
  public/
  README.md
```

## 快速开始（开发环境）

先决条件：已安装 Node.js (16+ 推荐)、npm 或 yarn、Python (3.8+)、Git。

1) 克隆仓库（如果尚未）：

```bash
git clone <仓库 URL>
cd ai智能对话助手
```

2) 后端（Python 服务）

```bash
cd backend/pyserver
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# 安装依赖
pip install -r requirements.txt
# 启动（示例）
python app/main.py
```

说明：具体启动命令取决于 `app/main.py` 中的入口实现，若使用 `uvicorn` 或 `flask` 请按相应方式启动，例如 `uvicorn app.main:app --reload`。

3) 后端（Node 服务）

```bash
cd ../../backend/server
npm install
# 启动开发服务（根据 package.json 中脚本）
npm start
```

4) 前端（Vite + Vue）

```bash
cd ../../front
npm install
npm run dev
# 浏览器打开：通常 http://localhost:3000 或控制台提示的地址
```

## 推送与分支
- 主分支：`main`（仓库主页中可见）
- 开发分支：`dev`（用于日常开发，若需要可推送到远程）

常用 Git 命令：

```bash
# 推送 dev 到远程
git checkout dev
git push -u origin dev
```

## 部署建议
- 按服务拆分部署：Node 后端部署到云主机或容器（Docker），Python 服务可部署为独立容器或 Azure/AWS 函数/虚拟机。
- 静态前端可部署到 Vercel、Netlify、GitHub Pages 或 CDN。
- 使用 CI（GitHub Actions）在推送/PR 时运行测试与构建。

## 贡献
- 欢迎提交 Issue 或 Pull Request。请在 PR 描述中说明变更与运行验证步骤。

## 常见问题
- 如果遇到跨平台换行（LF/CRLF）警告：可在 Git 中配置 `core.autocrlf`，或统一使用编辑器设置。

## 许可证
本仓库当前未指定许可证；若需要公开发布请补充合适的 `LICENSE` 文件（例如 MIT）。

