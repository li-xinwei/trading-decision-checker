# Trade Decision Checker — 开发进度

> 最后更新: 2026-02-23

## 项目概述

Chrome 扩展，在 TradingView 上强制执行交易决策树检查。在用户通过检查前，锁定所有交易按钮。

## 架构

```
extension/
├── manifest.json          # Chrome MV3 配置
├── background.ts          # Service Worker
├── content.ts             # 主内容脚本 (浮动面板 + 按钮锁定)
├── content.css            # 样式
├── sidepanel.ts           # 侧边栏 (已弃用，改用浮动面板)
├── decisionEngine.ts      # 决策树引擎
├── supabase.ts            # Supabase 数据加载
├── crosstrade.ts          # CrossTrade REST API 客户端
├── options.html           # 设置页面
├── options.ts             # 设置页面逻辑
├── types.ts               # 类型定义
└── dist/                  # esbuild 构建输出
```

## 已完成 ✅

### 核心功能
- [x] 决策树引擎 (decisionEngine.ts)
- [x] Supabase 数据加载
- [x] 可拖拽浮动面板 UI
- [x] 进度条 + 步骤显示
- [x] GO / CAUTION / NO-GO 结果展示
- [x] 执行方案显示 (entry, stopLoss, takeProfit)

### 按钮锁定
- [x] 真实 TradingView 按钮选择器:
  - `div[class*="buyButton-"]` — 买入按钮
  - `div[class*="sellButton-"]` — 卖出按钮
  - `#footer-chart-panel button` — 底部交易按钮
  - `#header-toolbar-trade-desktop > button` — 顶部交易按钮
- [x] 红色 ✕ 覆盖层 (frosted glass, 6px 圆角)
- [x] Capture-phase 事件拦截 (click/mousedown/mouseup/pointerdown/pointerup)
- [x] WeakMap 管理 blocker 清理
- [x] Broker 连接检测 (`#bottom-area .bottom-widgetbar-content`)
- [x] 无 broker 时按钮保持解锁 (引导用户连接)

### CrossTrade API 集成
- [x] crosstrade.ts — Bearer token 认证 (secret key 直接使用)
- [x] 仓位查询: `GET /v1/api/accounts/{account}/positions`
- [x] 连接测试: `GET /v1/api/accounts`
- [x] Options 设置页面 (Secret Key + Account Name)
- [x] API 优先 + DOM fallback 模式
- [x] Debounced MutationObserver (500ms) + 5s 轮询

### 锁定逻辑
- [x] 无 broker → 按钮解锁
- [x] Broker 连接 + 未通过检查 → 按钮锁定 (红色 ✕)
- [x] Broker 连接 + 检查通过 → 按钮解锁
- [x] 开仓后自动重新锁定

## 待完成 TODO 🔲

### 高优先级
- [ ] **测试 CrossTrade API 连接** — 当前返回 408 ("Client not ready")，需要确保 NinjaTrader 8 运行且 CrossTrade NT8 Add-On 已连接
- [ ] **验证仓位检测逻辑** — API 返回的 positions 数据结构需要实际验证
- [ ] **Secret Key 安全** — 之前在聊天中暴露了 key，需要在 CrossTrade Dashboard 重新生成

### 中优先级
- [ ] CrossTrade API 响应格式验证 — `{ positions: [...], success: boolean }` 需要确认
- [ ] 错误处理优化 — API 408 时的用户提示
- [ ] 按钮锁定在 TradingView 动态 DOM 变更时的稳定性
- [ ] 考虑 `tradovate.ts` 已删除但 git history 中仍有，确认无敏感信息

### 低优先级
- [ ] `extension.crx` / `extension.pem` 加入 .gitignore
- [ ] `.claude/` 目录加入 .gitignore
- [ ] 发布到 Chrome Web Store (需要时)
- [ ] 侧边栏 (sidepanel.ts) 清理或移除

## 关键配置

### CrossTrade API
- **Base URL**: `https://app.crosstrade.io/v1/api`
- **认证**: Bearer token (secret key 直接使用，无需 login/refresh)
- **配置存储**: `chrome.storage.sync` key = `tdc_crosstrade_config`
- **前提条件**: NinjaTrader 8 运行 + CrossTrade NT8 Add-On 连接状态

### 构建命令
```bash
npm run build:ext    # esbuild 一次性构建
npm run watch:ext    # esbuild watch 模式
```

## Git 状态

- **分支**: main
- **最新 commit**: `feat: replace Tradovate API with CrossTrade for position detection`
- **未推送**: 1 commit (网络问题，需要手动 `git push origin main`)
- **未跟踪文件**: `.claude/`, `extension.crx`, `extension.pem` (不应提交)
