// Content Script — injects a draggable floating panel into TradingView.
// Combines decision tree UI + trade button locking in one file.
// No innerHTML — all DOM via createElement.

import { DecisionEngine } from './decisionEngine';
import type { EngineState } from './decisionEngine';
import type { ResultNode, DecisionRecord } from './types';
import { loadSystemData } from './supabase';

// ==================== Panel State ====================

let engine: DecisionEngine | null = null;
let panelVisible = false;

// Lock states: 'unchecked' = no check done yet (unlocked),
// 'passed' = GO result (unlocked), 'blocked' = CAUTION/NO-GO (locked)
type LockState = 'unchecked' | 'passed' | 'blocked';
let lockState: LockState = 'unchecked';

// Panel DOM refs (set after buildPanel)
let panel: HTMLElement;
let toggleBtn: HTMLElement;
let mainEl: HTMLElement;
let progressArea: HTMLElement;
let progressStep: HTMLElement;
let progressCategory: HTMLElement;
let progressFill: HTMLElement;
let resetBtn: HTMLElement;

// ==================== Build Floating UI ====================

function buildPanel(): void {
  // Toggle button (floating circle)
  toggleBtn = el('button');
  toggleBtn.id = 'tdc-toggle-btn';
  toggleBtn.title = '开单前检查';
  toggleBtn.textContent = '✓';
  toggleBtn.addEventListener('click', togglePanel);
  document.body.appendChild(toggleBtn);

  // Panel
  panel = el('div');
  panel.id = 'tdc-panel';
  panel.classList.add('tdc-hidden');

  // Header
  const header = el('div');
  header.id = 'tdc-header';

  const headerLeft = el('div');
  headerLeft.id = 'tdc-header-left';
  const dragHandle = el('span');
  dragHandle.id = 'tdc-drag-handle';
  dragHandle.textContent = '⠿';
  const title = el('span', 'tdc-title');
  title.textContent = '开单检查';
  headerLeft.appendChild(dragHandle);
  headerLeft.appendChild(title);

  const headerRight = el('div');
  headerRight.id = 'tdc-header-right';
  resetBtn = el('button', 'tdc-header-btn tdc-hidden');
  resetBtn.textContent = '↺ 重来';
  resetBtn.addEventListener('click', doReset);
  const closeBtn = el('button', 'tdc-close-btn');
  closeBtn.textContent = '×';
  closeBtn.title = '收起';
  closeBtn.addEventListener('click', togglePanel);
  headerRight.appendChild(resetBtn);
  headerRight.appendChild(closeBtn);

  header.appendChild(headerLeft);
  header.appendChild(headerRight);
  panel.appendChild(header);

  // Progress area
  progressArea = el('div');
  progressArea.id = 'tdc-progress-area';
  progressArea.classList.add('tdc-hidden');

  const progressInfo = el('div', 'tdc-progress-info');
  progressStep = el('span');
  progressStep.id = 'tdc-progress-step';
  progressCategory = el('span');
  progressCategory.id = 'tdc-progress-category';
  progressInfo.appendChild(progressStep);
  progressInfo.appendChild(progressCategory);

  const bar = el('div', 'tdc-progress-bar');
  progressFill = el('div', 'tdc-progress-fill');
  bar.appendChild(progressFill);

  progressArea.appendChild(progressInfo);
  progressArea.appendChild(bar);
  panel.appendChild(progressArea);

  // Main content area
  mainEl = el('div');
  mainEl.id = 'tdc-main';
  panel.appendChild(mainEl);

  document.body.appendChild(panel);

  // Make header draggable
  makeDraggable(panel, header);
}

// ==================== Toggle ====================

function togglePanel(): void {
  panelVisible = !panelVisible;
  panel.classList.toggle('tdc-hidden', !panelVisible);
  toggleBtn.textContent = panelVisible ? '×' : '✓';
  toggleBtn.style.fontSize = panelVisible ? '22px' : '20px';
}

// ==================== Draggable ====================

function makeDraggable(target: HTMLElement, handle: HTMLElement): void {
  let startX = 0, startY = 0, startLeft = 60, startTop = 164;

  handle.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
    const rect = target.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const newLeft = Math.max(0, Math.min(window.innerWidth - 320, startLeft + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - 100, startTop + dy));
      target.style.left = `${newLeft}px`;
      target.style.top = `${newTop}px`;
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ==================== Init ====================

async function init(): Promise<void> {
  buildPanel();
  renderLoading();

  const system = await loadSystemData();
  if (!system) {
    renderError('无法加载交易系统数据，请检查网络连接');
    return;
  }

  engine = new DecisionEngine(system.treeConfig);
  engine.subscribe(onStateChange);
  renderReady();
}

// ==================== Reset ====================

function doReset(): void {
  engine?.reset();
  renderReady();
  progressArea.classList.add('tdc-hidden');
  resetBtn.classList.add('tdc-hidden');
  lockState = 'unchecked';
  updateLockState();
  chrome.runtime.sendMessage({ type: 'CHECK_RESET' });
}

// ==================== State Change Handler ====================

function onStateChange(state: EngineState): void {
  if (state.result) {
    renderResult(state.result, state.decisions);
    progressArea.classList.add('tdc-hidden');
    resetBtn.classList.remove('tdc-hidden');

    if (state.result.type === 'go') {
      lockState = 'passed';
      chrome.runtime.sendMessage({ type: 'CHECK_PASSED' });
    } else {
      lockState = 'blocked';
      chrome.runtime.sendMessage({ type: 'CHECK_RESET' });
    }
    updateLockState();
  } else if (state.currentNode) {
    renderQuestion(state);
    progressArea.classList.remove('tdc-hidden');
    progressStep.textContent = `步骤 ${state.currentStep}`;
    progressCategory.textContent = state.currentNode.category;
    progressFill.style.width = `${state.progress}%`;
    resetBtn.classList.toggle('tdc-hidden', state.decisions.length === 0);
  }
}

// ==================== Renderers ====================

function renderLoading(): void {
  clearMain();
  const wrap = el('div', 'tdc-loading');
  wrap.textContent = '加载中';
  const spinner = el('div', 'tdc-spinner');
  wrap.appendChild(spinner);
  mainEl.appendChild(wrap);
}

function renderError(message: string): void {
  clearMain();
  const wrap = el('div', 'tdc-error');
  const h3 = el('h3');
  h3.textContent = '加载失败';
  const p = el('p');
  p.textContent = message;
  const btn = el('button', 'tdc-retry-btn');
  btn.textContent = '重试';
  btn.addEventListener('click', () => {
    renderLoading();
    init();
  });
  wrap.appendChild(h3);
  wrap.appendChild(p);
  wrap.appendChild(btn);
  mainEl.appendChild(wrap);
}

function renderReady(): void {
  clearMain();
  const card = el('div', 'tdc-welcome-card');
  const h2 = el('h2');
  h2.textContent = '开单前检查';
  const p = el('p');
  p.textContent = '根据交易系统逐步筛选，确认是否满足入场条件';
  const btn = el('button', 'tdc-start-btn');
  btn.textContent = '开始检查';
  btn.addEventListener('click', () => {
    if (!engine) return;
    const state = engine.getState();
    if (state.currentNode) onStateChange(state);
  });
  card.appendChild(h2);
  card.appendChild(p);
  card.appendChild(btn);
  mainEl.appendChild(card);
}

function renderQuestion(state: EngineState): void {
  const node = state.currentNode!;
  clearMain();

  const card = el('div', 'tdc-question-card');

  const badge = el('span', 'tdc-category-badge');
  badge.textContent = node.category;
  card.appendChild(badge);

  const title = el('div', 'tdc-question-title');
  title.textContent = node.question;
  card.appendChild(title);

  if (node.description) {
    const desc = el('p', 'tdc-question-desc');
    desc.textContent = node.description;
    card.appendChild(desc);
  }

  const optList = el('div', 'tdc-options-list');
  for (const opt of node.options) {
    const btn = el('button', 'tdc-option-btn');
    const content = el('span', 'tdc-option-content');
    if (opt.icon) {
      const icon = el('span', 'tdc-option-icon');
      icon.textContent = opt.icon;
      content.appendChild(icon);
    }
    const lbl = el('span');
    lbl.textContent = opt.label;
    content.appendChild(lbl);
    const arrow = el('span', 'tdc-option-arrow');
    arrow.textContent = '›';
    btn.appendChild(content);
    btn.appendChild(arrow);
    btn.addEventListener('click', () => engine?.selectOption(opt.value));
    optList.appendChild(btn);
  }
  card.appendChild(optList);

  if (state.decisions.length > 0) {
    const backBtn = el('button', 'tdc-back-btn');
    backBtn.textContent = '← 返回上一步';
    backBtn.addEventListener('click', () => engine?.goBack());
    card.appendChild(backBtn);
  }

  mainEl.appendChild(card);
}

function renderResult(result: ResultNode, decisions: DecisionRecord[]): void {
  clearMain();

  const iconMap: Record<string, string> = { go: '✅', caution: '⚠️', 'no-go': '🚫' };
  const bgMap: Record<string, string> = {
    go: 'tdc-result-bg-go',
    caution: 'tdc-result-bg-caution',
    'no-go': 'tdc-result-bg-nogo',
  };

  const card = el('div', `tdc-result-card ${bgMap[result.type]}`);

  const icon = el('div', 'tdc-result-icon');
  icon.textContent = iconMap[result.type] ?? '';
  card.appendChild(icon);

  const title = el('div', 'tdc-result-title');
  title.textContent = result.title;
  card.appendChild(title);

  const msg = el('p', 'tdc-result-message');
  msg.textContent = result.message;
  card.appendChild(msg);

  // Execution plan (GO only)
  if (result.type === 'go' && result.executionPlan) {
    const plan = result.executionPlan;
    const planDiv = el('div', 'tdc-exec-plan');
    const planHeader = el('div', 'tdc-exec-header');
    planHeader.textContent = '🎯 执行方案';
    planDiv.appendChild(planHeader);
    const grid = el('div', 'tdc-exec-grid');
    grid.appendChild(makeExecItem('📈 入场', plan.entry));
    grid.appendChild(makeExecItem('🛡️ 止损', plan.stopLoss));
    grid.appendChild(makeExecItem('🎯 止盈', plan.takeProfit));
    planDiv.appendChild(grid);
    if (plan.notes) {
      const notes = el('div', 'tdc-exec-notes');
      notes.textContent = plan.notes;
      planDiv.appendChild(notes);
    }
    card.appendChild(planDiv);
  }

  // Suggestions (non-GO)
  if (result.suggestions.length > 0 && result.type !== 'go') {
    const box = el('div', 'tdc-suggestions');
    const hdr = el('div', 'tdc-suggestions-header');
    hdr.textContent = '💡 建议';
    box.appendChild(hdr);
    const list = document.createElement('ul');
    list.className = 'tdc-suggestions-list';
    for (const s of result.suggestions) {
      const li = document.createElement('li');
      li.textContent = s;
      list.appendChild(li);
    }
    box.appendChild(list);
    card.appendChild(box);
  }

  // Decision path toggle
  const pathToggle = el('div', 'tdc-path-toggle');
  pathToggle.textContent = `决策路径（${decisions.length}步）▾`;
  const pathDiv = el('div', 'tdc-path tdc-hidden');
  for (let i = 0; i < decisions.length; i++) {
    const d = decisions[i];
    const item = el('div', 'tdc-path-item');
    const step = el('span', 'tdc-path-step');
    step.textContent = String(i + 1);
    item.appendChild(step);
    const info = el('div');
    const q = el('div', 'tdc-path-q');
    q.textContent = d.question;
    const a = el('div', 'tdc-path-a');
    a.textContent = d.answer;
    info.appendChild(q);
    info.appendChild(a);
    item.appendChild(info);
    pathDiv.appendChild(item);
  }
  pathToggle.addEventListener('click', () => pathDiv.classList.toggle('tdc-hidden'));
  card.appendChild(pathToggle);
  card.appendChild(pathDiv);

  // Actions
  const actions = el('div', 'tdc-result-actions');
  const backBtn = el('button', 'tdc-back-btn');
  backBtn.textContent = '← 返回修改';
  backBtn.addEventListener('click', () => engine?.goBack());
  actions.appendChild(backBtn);
  const newBtn = el('button', 'tdc-reset-btn');
  newBtn.textContent = '↺ 新的检查';
  newBtn.addEventListener('click', doReset);
  actions.appendChild(newBtn);
  card.appendChild(actions);

  mainEl.appendChild(card);
}

// ==================== Helpers ====================

function el(tag: string, className?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function makeExecItem(label: string, value: string): HTMLElement {
  const item = el('div', 'tdc-exec-item');
  const lbl = el('div', 'tdc-exec-label');
  lbl.textContent = label;
  const val = el('div', 'tdc-exec-value');
  val.textContent = value;
  item.appendChild(lbl);
  item.appendChild(val);
  return item;
}

function clearMain(): void {
  while (mainEl.firstChild) mainEl.removeChild(mainEl.firstChild);
}

// ==================== Trade Button Locking ====================

const ORDER_BUTTON_SELECTORS = [
  '[data-name="submit-button-buy"]',
  '[data-name="submit-button-sell"]',
  'button[class*="buyButton"]',
  'button[class*="sellButton"]',
  '.order-panel button[class*="submit"]',
  '.bottomWidgetBar button[class*="buy"]',
  '.bottomWidgetBar button[class*="sell"]',
];

function findTradeButtons(): HTMLElement[] {
  const buttons: HTMLElement[] = [];
  for (const selector of ORDER_BUTTON_SELECTORS) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => buttons.push(el));
  }
  return buttons;
}

function lockButton(btn: HTMLElement): void {
  if (btn.classList.contains('tdc-locked')) return;
  btn.classList.add('tdc-locked');
  const overlay = document.createElement('div');
  overlay.className = 'tdc-lock-overlay';
  overlay.setAttribute('data-tdc', 'overlay');
  overlay.textContent = '\uD83D\uDD12 请先完成检查';
  btn.style.position = 'relative';
  btn.appendChild(overlay);
}

function unlockButton(btn: HTMLElement): void {
  if (!btn.classList.contains('tdc-locked')) return;
  btn.classList.remove('tdc-locked');
  btn.querySelector('[data-tdc="overlay"]')?.remove();
}

function updateLockState(): void {
  const buttons = findTradeButtons();
  if (buttons.length === 0) return;
  for (const btn of buttons) {
    // Only lock when a check was done and result was not GO
    lockState === 'blocked' ? lockButton(btn) : unlockButton(btn);
  }
}

// ==================== Message Listener ====================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CHECK_PASSED') {
    lockState = 'passed';
    updateLockState();
    sendResponse({ ok: true });
  } else if (message.type === 'CHECK_RESET') {
    lockState = 'unchecked';
    updateLockState();
    sendResponse({ ok: true });
  }
});

// ==================== DOM Observer ====================

const observer = new MutationObserver(updateLockState);
observer.observe(document.body, { childList: true, subtree: true });
setInterval(updateLockState, 2000);

// ==================== Boot ====================
init();
