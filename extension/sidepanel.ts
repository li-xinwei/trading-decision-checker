// Side Panel UI — renders decision tree states via DOM manipulation.
// No innerHTML — all DOM constructed via createElement for security.

import { DecisionEngine } from './decisionEngine';
import type { EngineState } from './decisionEngine';
import type { ResultNode, DecisionRecord } from './types';
import { loadSystemData } from './supabase';

// ==================== DOM References ====================
const mainEl = document.getElementById('main')!;
const progressArea = document.getElementById('progress-area')!;
const progressStep = document.getElementById('progress-step')!;
const progressCategory = document.getElementById('progress-category')!;
const progressFill = document.getElementById('progress-fill')!;
const resetBtn = document.getElementById('reset-btn')!;

let engine: DecisionEngine | null = null;
let started = false;

// ==================== Init ====================
async function init() {
  renderLoading();

  const system = await loadSystemData();
  if (!system) {
    renderError('无法加载交易系统数据，请检查网络连接');
    return;
  }

  engine = new DecisionEngine(system.treeConfig);
  engine.subscribe(onStateChange);

  resetBtn.addEventListener('click', () => {
    started = false;
    engine?.reset();
    renderReady();
    progressArea.classList.add('hidden');
    resetBtn.classList.add('hidden');
    chrome.runtime.sendMessage({ type: 'CHECK_RESET' });
  });

  renderReady();
}

// ==================== State Change Handler ====================
function onStateChange(state: EngineState): void {
  if (state.result) {
    renderResult(state.result, state.decisions);
    progressArea.classList.add('hidden');
    resetBtn.classList.remove('hidden');

    if (state.result.type === 'go') {
      chrome.runtime.sendMessage({ type: 'CHECK_PASSED' });
    } else {
      chrome.runtime.sendMessage({ type: 'CHECK_RESET' });
    }
  } else if (state.currentNode) {
    renderQuestion(state);
    progressArea.classList.remove('hidden');
    progressStep.textContent = `步骤 ${state.currentStep}`;
    progressCategory.textContent = state.currentNode.category;
    progressFill.style.width = `${state.progress}%`;
    resetBtn.classList.toggle('hidden', state.decisions.length === 0);
  }
}

// ==================== Renderers ====================

function renderLoading(): void {
  clearMain();
  const div = el('div', 'loading');
  div.textContent = '加载中';
  mainEl.appendChild(div);
}

function renderError(message: string): void {
  clearMain();
  const card = el('div', 'error-card');

  const h2 = el('h2');
  h2.textContent = '加载失败';
  card.appendChild(h2);

  const p = el('p');
  p.textContent = message;
  card.appendChild(p);

  const btn = el('button', 'retry-btn');
  btn.textContent = '重试';
  btn.addEventListener('click', () => location.reload());
  card.appendChild(btn);

  mainEl.appendChild(card);
}

function renderReady(): void {
  clearMain();
  const card = el('div', 'welcome-card');

  const h2 = el('h2');
  h2.textContent = '开单前检查';
  card.appendChild(h2);

  const p = el('p');
  p.textContent = '根据交易系统逐步筛选，确认是否满足入场条件';
  card.appendChild(p);

  const btn = el('button', 'start-btn');
  btn.textContent = '开始检查';
  btn.addEventListener('click', () => {
    if (!engine) return;
    started = true;
    const state = engine.getState();
    if (state.currentNode) {
      onStateChange(state);
    }
  });
  card.appendChild(btn);

  mainEl.appendChild(card);
}

function renderQuestion(state: EngineState): void {
  const node = state.currentNode!;
  clearMain();

  const card = el('div', 'question-card');

  // Category badge
  const badge = el('span', 'question-category-badge');
  badge.textContent = node.category;
  card.appendChild(badge);

  // Title
  const title = el('h2', 'question-title');
  title.textContent = node.question;
  card.appendChild(title);

  // Description
  if (node.description) {
    const desc = el('p', 'question-description');
    desc.textContent = node.description;
    card.appendChild(desc);
  }

  // Options
  const optionsList = el('div', 'options-list');
  for (const opt of node.options) {
    const btn = el('button', 'option-btn');

    const content = el('span', 'option-content');
    if (opt.icon) {
      const iconSpan = el('span', 'option-icon');
      iconSpan.textContent = opt.icon;
      content.appendChild(iconSpan);
    }
    const label = el('span', 'option-label');
    label.textContent = opt.label;
    content.appendChild(label);

    const arrow = el('span', 'option-arrow');
    arrow.textContent = '\u203A'; // ›
    btn.appendChild(content);
    btn.appendChild(arrow);

    btn.addEventListener('click', () => engine?.selectOption(opt.value));
    optionsList.appendChild(btn);
  }
  card.appendChild(optionsList);

  // Back button
  if (state.decisions.length > 0) {
    const backBtn = el('button', 'back-btn');
    backBtn.textContent = '\u2190 返回上一步';
    backBtn.addEventListener('click', () => engine?.goBack());
    card.appendChild(backBtn);
  }

  mainEl.appendChild(card);
}

function renderResult(result: ResultNode, decisions: DecisionRecord[]): void {
  clearMain();

  const iconMap: Record<string, string> = { go: '\u2705', caution: '\u26A0\uFE0F', 'no-go': '\uD83D\uDEAB' };
  const bgClass: Record<string, string> = {
    go: 'result-bg-go',
    caution: 'result-bg-caution',
    'no-go': 'result-bg-nogo',
  };

  const card = el('div', `result-card ${bgClass[result.type]}`);

  // Icon
  const icon = el('div', 'result-icon');
  icon.textContent = iconMap[result.type] ?? '';
  card.appendChild(icon);

  // Title
  const title = el('h2', 'result-title');
  title.textContent = result.title;
  card.appendChild(title);

  // Message
  const msg = el('p', 'result-message');
  msg.textContent = result.message;
  card.appendChild(msg);

  // Execution plan (GO only)
  if (result.type === 'go' && result.executionPlan) {
    const plan = result.executionPlan;
    const planDiv = el('div', 'execution-plan');

    const planHeader = el('div', 'execution-plan-header');
    planHeader.textContent = '\uD83C\uDFAF 执行方案';
    planDiv.appendChild(planHeader);

    const grid = el('div', 'execution-plan-grid');
    grid.appendChild(makeExecItem('\uD83D\uDCC8 入场', plan.entry));
    grid.appendChild(makeExecItem('\uD83D\uDEE1\uFE0F 止损', plan.stopLoss));
    grid.appendChild(makeExecItem('\uD83C\uDFAF 止盈', plan.takeProfit));
    planDiv.appendChild(grid);

    if (plan.notes) {
      const notes = el('div', 'execution-notes');
      notes.textContent = plan.notes;
      planDiv.appendChild(notes);
    }

    card.appendChild(planDiv);
  }

  // Suggestions (non-GO)
  if (result.suggestions.length > 0 && result.type !== 'go') {
    const box = el('div', 'suggestions-box');

    const header = el('div', 'suggestions-header');
    header.textContent = '\uD83D\uDCA1 建议';
    box.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'suggestions-list';
    for (const s of result.suggestions) {
      const li = document.createElement('li');
      li.textContent = s;
      list.appendChild(li);
    }
    box.appendChild(list);
    card.appendChild(box);
  }

  // Decision path toggle
  const toggle = el('div', 'decision-path-toggle');
  toggle.textContent = `决策路径（${decisions.length}步）▾`;

  const pathDiv = el('div', 'decision-path hidden');
  for (let i = 0; i < decisions.length; i++) {
    const d = decisions[i];
    const item = el('div', 'path-item');

    const step = el('span', 'path-step');
    step.textContent = String(i + 1);
    item.appendChild(step);

    const info = el('div');
    const q = el('div', 'path-question');
    q.textContent = d.question;
    const a = el('div', 'path-answer');
    a.textContent = d.answer;
    info.appendChild(q);
    info.appendChild(a);
    item.appendChild(info);

    pathDiv.appendChild(item);
  }

  toggle.addEventListener('click', () => pathDiv.classList.toggle('hidden'));
  card.appendChild(toggle);
  card.appendChild(pathDiv);

  // Actions
  const actions = el('div', 'result-actions');

  const backBtn = el('button', 'back-btn');
  backBtn.textContent = '\u2190 返回修改';
  backBtn.addEventListener('click', () => engine?.goBack());
  actions.appendChild(backBtn);

  const resetActionBtn = el('button', 'reset-action-btn');
  resetActionBtn.textContent = '↺ 新的检查';
  resetActionBtn.addEventListener('click', () => {
    started = false;
    engine?.reset();
    renderReady();
    progressArea.classList.add('hidden');
    resetBtn.classList.add('hidden');
    chrome.runtime.sendMessage({ type: 'CHECK_RESET' });
  });
  actions.appendChild(resetActionBtn);

  card.appendChild(actions);
  mainEl.appendChild(card);
}

// ==================== Helpers ====================

function el(tag: string, className?: string): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function makeExecItem(label: string, value: string): HTMLElement {
  const item = el('div', 'execution-item');
  const lbl = el('div', 'execution-item-label');
  lbl.textContent = label;
  const val = el('div', 'execution-item-value');
  val.textContent = value;
  item.appendChild(lbl);
  item.appendChild(val);
  return item;
}

function clearMain(): void {
  while (mainEl.firstChild) {
    mainEl.removeChild(mainEl.firstChild);
  }
}

// ==================== Boot ====================
init();
