# Trade Decision Checker — 开发进度

> 最后更新: 2026-02-25

## 项目概述

Trading Portal — 包含 Chrome 扩展 (TradingView 按钮锁定) 和 Web App (Ask Brooks AI Q&A + 交易管理工具)。

## 架构

```
src/                                # React + Vite Web App
├── pages/
│   ├── AskBrooksPage.tsx          # AI Q&A 落地页 (Perplexity 风格)
│   ├── DashboardPage.tsx          # 工具仪表盘 (/tools)
│   ├── CheckPage.tsx              # 决策树检查
│   ├── SessionPage.tsx            # 交易 Session
│   ├── SystemEditorPage.tsx       # 系统编辑器
│   ├── DailySummaryPage.tsx       # 每日总结
│   └── AnalyticsPage.tsx          # 系统复盘
├── components/                    # 可复用组件
├── lib/
│   ├── supabase.ts                # Supabase 数据层
│   └── openai.ts                  # OpenAI 格式化
├── types/                         # TypeScript 类型
└── test/                          # 测试配置

api/                                # Python API (FastAPI)
├── main.py                        # FastAPI 服务 + NotebookLM 集成
├── requirements.txt               # Python 依赖 (fastapi, uvicorn, notebooklm-py, pydantic)
├── Dockerfile                     # Docker 部署配置 (Render)
├── render.yaml                    # Render 部署配置
├── .env.example                   # 环境变量模板
└── README.md                      # API 使用文档

extension/                          # Chrome 扩展 (MV3)
├── manifest.json                  # Manifest V3 配置
├── background.ts                  # Service Worker: 消息中继 + Side Panel 切换
├── content.ts                     # 浮动面板 + 按钮锁定 (TradingView 注入)
├── crosstrade.ts                  # CrossTrade API 客户端 (Bearer token)
├── options.html / options.ts      # 设置页面
├── decisionEngine.ts              # 决策树引擎 (vanilla TS observer pattern)
├── supabase.ts                    # Supabase REST 数据加载 + chrome.storage 缓存
└── dist/                          # esbuild 构建输出 (IIFE)
```

---

## 已完成 ✅

### Ask Brooks — AI Q&A 落地页 (2026-02-24)
- [x] **AskBrooksPage.tsx** — Perplexity 风格的 AI 问答落地页
  - 亮色主题 (warm off-white `rgb(252,251,247)`, teal accent `#1a7f8a`)
  - Inter 字体, -1.5px title letter-spacing
  - Hero 搜索框 + 6 个预设问题 pills
  - 对话式 chat 视图 (ReactMarkdown 渲染 + 来源引用)
  - 打字指示器动画
  - Mock 响应 (无 API 时提供 Al Brooks 风格答案)
  - `VITE_ASK_BROOKS_API_URL` 环境变量接入真实 API
- [x] **路由更新** — Ask Brooks 为 `/` (落地页)，工具仪表盘移至 `/tools`
- [x] **导航** — 顶部导航栏链接: Session, System, Summary, Analytics
- [x] **CSS** — 独立 `.ab-` 前缀样式 (~250 行)，不影响其他页面暗色主题
- [x] **响应式** — 移动端适配 (max-width: 600px)

### Ask Brooks — Python API 后端 (2026-02-24 ~ 02-25)
- [x] **api/main.py** — FastAPI 服务
  - `POST /ask` — 接收问题，通过 NotebookLM 查询 Al Brooks 书籍
  - `GET /health` — 健康检查
  - CORS 配置支持前端跨域
  - NotebookLM 客户端: `NotebookLMClient.from_storage()` + async 单例模式
  - `_ensure_storage_state()` — 从 `NOTEBOOKLM_STORAGE_B64` 环境变量解码 storage_state.json (云端部署用)
  - `client.chat.ask(NOTEBOOK_ID, question)` → 返回 `AskResult.answer`
- [x] **api/Dockerfile** — Docker 部署配置 (Python 3.12 + Playwright + Chromium)
  - 动态端口: `CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}`
- [x] **api/requirements.txt** — fastapi==0.115.6, uvicorn==0.34.0, notebooklm-py==0.1.1, pydantic==2.10.4, python-dotenv==1.0.1
- [x] **api/.env.example** — 环境变量模板
- [x] **api/render.yaml** — Render 部署配置
- [x] **本地测试通过** — NotebookLM 登录成功，API /ask 返回高质量 Al Brooks 回答
- [x] **notebooklm-py API 用法**:
  - CLI: `notebooklm login` / `notebooklm list` / `notebooklm ask "question"`
  - Python: `await NotebookLMClient.from_storage()` → `async with client:` → `client.chat.ask(notebook_id, question)`
  - `ChatAPI.ask` 签名: `(self, notebook_id: str, question: str, ...) -> AskResult`
  - `AskResult` 字段: `answer` (str), `conversation_id`, `is_follow_up`, `turn_number`

### 测试 (2026-02-24)
- [x] **AskBrooksPage.test.tsx** — 16 个测试用例
  - Hero 渲染 (标题、副标题、搜索框、预设问题)
  - 导航链接 (Session, System, Summary, Analytics)
  - 搜索提交 (按钮点击、Enter 键、预设 pill 点击)
  - Chat 视图切换 (搜索框变为 follow-up 输入)
  - Mock 响应渲染 (Markdown 标题、来源标签)
  - 打字指示器
- [x] **全部测试通过** — 97/97 tests, 12 test files
- [x] **测试修复记录**:
  - `getByText('Ask Brooks')` 多匹配 → `getByRole('heading', { name: 'Ask Brooks' })`
  - jsdom 无 `scrollIntoView` → `scrollIntoView?.()` optional chaining
  - 提交后 input 不清空 → 改测 chat 视图切换
  - Markdown 渲染多匹配 → `getByRole('heading', { name: /pattern/i })`

### 部署 (2026-02-24 ~ 02-25)
- [x] **Vercel 部署** — 前端已部署到生产环境
  - 自定义域名: `kentrades.com`
  - SPA 路由: `vercel.json` rewrites 配置
  - 自动构建: `npm run build` → `dist/`
  - 环境变量: `VITE_ASK_BROOKS_API_URL=https://trading-decision-checker.onrender.com`
- [x] **Render 部署** — Python API 已部署到生产环境
  - URL: `https://trading-decision-checker.onrender.com`
  - Docker runtime (Python 3.12 + Playwright + Chromium)
  - 环境变量: `NOTEBOOKLM_STORAGE_B64`, `NOTEBOOKLM_NOTEBOOK_ID`, `CORS_ORIGINS`, `PORT`
  - NotebookLM Notebook ID: `33b8d0b2-ee3f-43f3-ba62-e8095ba5f03b` (Trading Price Action)
  - ⚠️ 免费 tier 15 分钟无请求后休眠，首次访问冷启动 30-60s
  - ⚠️ Google cookies 约数周过期，需本地 `notebooklm login` 后更新 `NOTEBOOKLM_STORAGE_B64`

### Chrome 扩展 — 核心功能
- [x] 决策树引擎 (decisionEngine.ts) — vanilla TS + observer pattern
- [x] Supabase REST 数据加载 (无 SDK, 直接 fetch + chrome.storage.local 缓存)
- [x] 可拖拽浮动面板 UI
- [x] 进度条 + 步骤显示
- [x] GO / CAUTION / NO-GO 结果展示
- [x] 执行方案显示 (entry, stopLoss, takeProfit)

### Chrome 扩展 — 按钮锁定
- [x] 真实 TradingView 按钮选择器:
  - `div[class*="buyButton-"]` — 买入按钮
  - `div[class*="sellButton-"]` — 卖出按钮
  - `#footer-chart-panel button` — 底部交易按钮
  - `#header-toolbar-trade-desktop > button` — 顶部交易按钮
- [x] 红色 ✕ 覆盖层 (frosted glass, 6px 圆角)
- [x] Capture-phase 事件拦截
- [x] WeakMap 管理 blocker 清理
- [x] Broker 连接检测 + 无 broker 时按钮保持解锁

### Chrome 扩展 — CrossTrade API 集成
- [x] crosstrade.ts — Bearer token 认证
- [x] 仓位查询 + 连接测试
- [x] Options 设置页面
- [x] API 优先 + DOM fallback 模式
- [x] Debounced MutationObserver (500ms) + 5s 轮询

### Chrome 扩展 — 锁定逻辑
- [x] 无 broker → 按钮解锁
- [x] Broker 连接 + 未通过检查 → 按钮锁定
- [x] Broker 连接 + 检查通过 → 按钮解锁
- [x] 开仓后自动重新锁定

---

## 待完成 TODO 🔲

### 高优先级
- [ ] **测试 CrossTrade API 连接** — 需要 NinjaTrader 8 运行
- [ ] **Secret Key 安全** — 重新生成 CrossTrade key

### 中优先级
- [ ] CrossTrade API 响应格式验证
- [ ] 错误处理优化 — API 408 用户提示
- [ ] 按钮锁定在 TradingView 动态 DOM 变更时的稳定性
- [ ] Ask Brooks API 添加对话历史支持 (conversation_id)
- [ ] Ask Brooks 前端: 流式响应 / streaming

### 低优先级
- [ ] `extension.crx` / `extension.pem` 加入 .gitignore
- [ ] `.claude/` 目录加入 .gitignore
- [ ] 发布到 Chrome Web Store
- [ ] 侧边栏清理或移除

---

## 关键配置

### 前端 (Vercel)
- **框架**: React 19 + Vite 7 + TypeScript
- **域名**: `kentrades.com`
- **路由**: `/` Ask Brooks, `/tools` 工具仪表盘, `/session/:id`, `/system`, `/summary`, `/analytics`
- **环境变量**: `VITE_ASK_BROOKS_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPENAI_API_KEY`

### Ask Brooks API (Render)
- **URL**: `https://trading-decision-checker.onrender.com`
- **框架**: FastAPI + notebooklm-py 0.1.1
- **Runtime**: Docker (Python 3.12 + Playwright)
- **Notebook ID**: `33b8d0b2-ee3f-43f3-ba62-e8095ba5f03b`
- **环境变量**: `NOTEBOOKLM_STORAGE_B64`, `NOTEBOOKLM_NOTEBOOK_ID`, `CORS_ORIGINS`, `PORT`
- **Cookies 刷新步骤**:
  ```bash
  cd api && source .venv/bin/activate
  notebooklm login                    # 浏览器 Google OAuth
  base64 -i ~/.notebooklm/storage_state.json | tr -d '\n' | pbcopy
  # 粘贴到 Render 环境变量 NOTEBOOKLM_STORAGE_B64
  ```

### CrossTrade API
- **Base URL**: `https://app.crosstrade.io/v1/api`
- **认证**: Bearer token (secret key)
- **配置存储**: `chrome.storage.sync` key = `tdc_crosstrade_config`
- **前提条件**: NinjaTrader 8 运行 + CrossTrade NT8 Add-On 连接

### 构建命令
```bash
npm run dev          # Vite 开发服务器 (port 5173)
npm run build        # TypeScript + Vite 生产构建
npm test             # 运行所有测试 (vitest, 97/97)
npm run build:ext    # Chrome 扩展构建 (esbuild → IIFE)
npm run watch:ext    # Chrome 扩展 watch 模式

# API 本地开发
cd api && source .venv/bin/activate
python main.py       # FastAPI 开发服务器 (port 8000, reload)
```

---

## Chrome 扩展设计文档摘要

### 架构概要
Chrome Extension (MV3): Side Panel 运行决策树检查 + Content Script 注入 TradingView 锁定交易按钮。

### 数据流
1. Side Panel → fetch `TradingSystemData` from Supabase REST API (read-only)
2. 缓存到 `chrome.storage.local`
3. 用户完成决策树 → `CHECK_PASSED` 消息
4. Background 中继到 Content Script → 解锁按钮
5. Reset/超时 → `CHECK_RESET` → 重新锁定

### 扩展权限
- `permissions`: sidePanel, storage
- `host_permissions`: `https://*.tradingview.com/*`
- Content Script: 匹配 `https://*.tradingview.com/*`, document_idle 注入

### 按钮锁定策略
- MutationObserver (body, childList + subtree) + setInterval(2s) 备份
- 检测无 broker 连接 → 不锁定
- Capture-phase 事件拦截 + pointer-events: none
- WeakMap 跟踪 overlay 生命周期

---

## 本次 Session 记录 (2026-02-25)

### 完成的工作
1. ✅ Python venv 创建 + 依赖安装 (api/.venv)
2. ✅ NotebookLM 登录 → storage_state.json 生成
3. ✅ 发现并适配 notebooklm-py 0.1.1 真实 API:
   - CLI: `notebooklm login/list/ask` (不是 `python -m notebooklm`)
   - Python: `NotebookLMClient.from_storage()` → async context manager
   - `client.chat.ask(notebook_id, question)` → `AskResult.answer`
4. ✅ 重写 main.py 适配新 API + 添加 `_ensure_storage_state()` 支持 base64 env var
5. ✅ 本地 API 测试通过
6. ✅ Render Docker 部署成功 (trading-decision-checker.onrender.com)
7. ✅ Vercel 环境变量 `VITE_ASK_BROOKS_API_URL` 设置 + 重新部署
8. ✅ 端到端验证: kentrades.com → Render API → NotebookLM → Al Brooks 回答
9. ✅ PROGRESS.md 更新

### 遇到的问题
- `python -m notebooklm login` 不存在 → 正确命令是 `notebooklm login`
- Playwright 未安装 → `pip install playwright && python -m playwright install chromium`
- Railway 试用过期 → 改用 Render
- Dockerfile CMD 端口写死 → 改为 `${PORT:-8000}`
- `.env.example` 被 `.env.*` gitignore 规则匹配 → 添加 `!.env.example`
