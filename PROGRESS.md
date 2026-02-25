# Trade Decision Checker — 开发进度

> 最后更新: 2026-02-24

## 项目概述

Trading Portal — 包含 Chrome 扩展 (TradingView 按钮锁定) 和 Web App (Ask Brooks AI Q&A + 交易管理工具)。

## 架构

```
src/                                # React + Vite Web App
├── pages/
│   ├── AskBrooksPage.tsx          # 🆕 AI Q&A 落地页 (Perplexity 风格)
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

api/                                # 🆕 Python API (FastAPI)
├── main.py                        # FastAPI 服务 + NotebookLM 集成
├── requirements.txt               # Python 依赖
├── Dockerfile                     # Docker 部署配置
├── .env.example                   # 环境变量模板
└── README.md                      # API 使用文档

extension/                          # Chrome 扩展 (MV3)
├── manifest.json
├── background.ts
├── content.ts                     # 浮动面板 + 按钮锁定
├── crosstrade.ts                  # CrossTrade API 客户端
├── options.html / options.ts      # 设置页面
├── decisionEngine.ts              # 决策树引擎
├── supabase.ts                    # Supabase 数据加载
└── dist/                          # esbuild 构建输出
```

## 已完成 ✅

### Ask Brooks — AI Q&A 落地页 (2026-02-24)
- [x] **AskBrooksPage.tsx** — Perplexity 风格的 AI 问答落地页
  - 亮色主题 (warm off-white `rgb(252,251,247)`, teal accent `#1a7f8a`)
  - Inter 字体, -1.5px title letter-spacing
  - Hero 搜索框 + 6 个预设问题 pills
  - 对话式 chat 视图 (Markdown 渲染 + 来源引用)
  - 打字指示器动画
  - Mock 响应 (无 API 时提供 Al Brooks 风格答案)
  - `VITE_ASK_BROOKS_API_URL` 环境变量接入真实 API
- [x] **路由更新** — Ask Brooks 为 `/` (落地页)，工具仪表盘移至 `/tools`
- [x] **导航** — 顶部导航栏链接: Session, System, Summary, Analytics
- [x] **CSS** — 独立 `.ab-` 前缀样式，不影响其他页面暗色主题
- [x] **响应式** — 移动端适配 (max-width: 600px)

### Ask Brooks — Python API 后端 (2026-02-24)
- [x] **api/main.py** — FastAPI 服务
  - `POST /ask` — 接收问题，通过 NotebookLM 查询 Al Brooks 书籍
  - `GET /health` — 健康检查
  - CORS 配置支持前端跨域
  - NotebookLM 客户端懒初始化 + 单例模式
- [x] **api/Dockerfile** — Docker 部署配置 (Python 3.12 + Playwright)
- [x] **api/requirements.txt** — FastAPI, uvicorn, notebooklm-py, pydantic
- [x] **api/.env.example** — 环境变量模板

### 测试 (2026-02-24)
- [x] **AskBrooksPage.test.tsx** — 16 个测试用例
  - Hero 渲染 (标题、副标题、搜索框、预设问题)
  - 导航链接 (Session, System, Summary, Analytics)
  - 搜索提交 (按钮点击、Enter 键、预设 pill 点击)
  - Chat 视图切换 (搜索框变为 follow-up 输入)
  - Mock 响应渲染 (Markdown 标题、来源标签)
  - 打字指示器
- [x] **全部测试通过** — 97/97 tests, 12 test files

### 部署 (2026-02-24)
- [x] **Vercel 部署** — 前端已部署到生产环境
  - 自定义域名: `kentrades.com`
  - SPA 路由: `vercel.json` rewrites 配置
  - 自动构建: `npm run build` → `dist/`

### Chrome 扩展 — 核心功能
- [x] 决策树引擎 (decisionEngine.ts)
- [x] Supabase 数据加载
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

## 待完成 TODO 🔲

### 高优先级
- [ ] **部署 Ask Brooks Python API** — 需要部署到 Railway/Render，配置 NotebookLM 登录
  - 运行 `python -m notebooklm login` 生成 `storage_state.json`
  - 设置环境变量 `NOTEBOOKLM_NOTEBOOK_URL`
  - 在 Vercel 设置 `VITE_ASK_BROOKS_API_URL` 指向 API 地址
- [ ] **测试 CrossTrade API 连接** — 需要 NinjaTrader 8 运行
- [ ] **Secret Key 安全** — 重新生成 CrossTrade key

### 中优先级
- [ ] CrossTrade API 响应格式验证
- [ ] 错误处理优化 — API 408 用户提示
- [ ] 按钮锁定在 TradingView 动态 DOM 变更时的稳定性

### 低优先级
- [ ] `extension.crx` / `extension.pem` 加入 .gitignore
- [ ] `.claude/` 目录加入 .gitignore
- [ ] 发布到 Chrome Web Store
- [ ] 侧边栏清理或移除

## 关键配置

### 前端 (Vercel)
- **框架**: React 19 + Vite 7 + TypeScript
- **域名**: `kentrades.com`
- **路由**: `/` Ask Brooks, `/tools` 工具仪表盘, `/session/:id`, `/system`, `/summary`, `/analytics`
- **环境变量**: `VITE_ASK_BROOKS_API_URL` (API 地址), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPENAI_API_KEY`

### Ask Brooks API (待部署)
- **框架**: FastAPI + notebooklm-py
- **端口**: 8000
- **环境变量**: `NOTEBOOKLM_STORAGE_STATE`, `NOTEBOOKLM_NOTEBOOK_URL`, `CORS_ORIGINS`, `PORT`

### CrossTrade API
- **Base URL**: `https://app.crosstrade.io/v1/api`
- **认证**: Bearer token (secret key)
- **配置存储**: `chrome.storage.sync` key = `tdc_crosstrade_config`
- **前提条件**: NinjaTrader 8 运行 + CrossTrade NT8 Add-On 连接

### 构建命令
```bash
npm run dev          # Vite 开发服务器
npm run build        # TypeScript + Vite 生产构建
npm test             # 运行所有测试 (vitest)
npm run build:ext    # Chrome 扩展构建 (esbuild)
npm run watch:ext    # Chrome 扩展 watch 模式
```
