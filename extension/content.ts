// Content Script — runs on TradingView pages.
// Locks Buy/Sell trade buttons until the decision tree check passes GO.

// ==================== State ====================

let checkPassed = false;

// ==================== Selectors ====================
// TradingView order panel button selectors — cast a wide net since TV updates its DOM.

const ORDER_BUTTON_SELECTORS = [
  '[data-name="submit-button-buy"]',
  '[data-name="submit-button-sell"]',
  'button[class*="buyButton"]',
  'button[class*="sellButton"]',
  '.order-panel button[class*="submit"]',
  '.bottomWidgetBar button[class*="buy"]',
  '.bottomWidgetBar button[class*="sell"]',
];

// ==================== Button Detection ====================

function findTradeButtons(): HTMLElement[] {
  const buttons: HTMLElement[] = [];
  for (const selector of ORDER_BUTTON_SELECTORS) {
    const found = document.querySelectorAll<HTMLElement>(selector);
    found.forEach((el) => buttons.push(el));
  }
  return buttons;
}

// ==================== Lock / Unlock ====================

function lockButton(btn: HTMLElement): void {
  if (btn.classList.contains('tdc-locked')) return;

  btn.classList.add('tdc-locked');
  const overlay = document.createElement('div');
  overlay.className = 'tdc-lock-overlay';
  overlay.setAttribute('data-tdc', 'overlay');
  overlay.textContent = '\uD83D\uDD12 \u8BF7\u5148\u5B8C\u6210\u68C0\u67E5';
  btn.style.position = 'relative';
  btn.appendChild(overlay);
}

function unlockButton(btn: HTMLElement): void {
  if (!btn.classList.contains('tdc-locked')) return;

  btn.classList.remove('tdc-locked');
  const overlay = btn.querySelector('[data-tdc="overlay"]');
  if (overlay) overlay.remove();
}

function updateLockState(): void {
  const buttons = findTradeButtons();
  if (buttons.length === 0) return;

  for (const btn of buttons) {
    if (checkPassed) {
      unlockButton(btn);
    } else {
      lockButton(btn);
    }
  }
}

// ==================== Message Listener ====================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CHECK_PASSED') {
    checkPassed = true;
    updateLockState();
    sendResponse({ ok: true });
  } else if (message.type === 'CHECK_RESET') {
    checkPassed = false;
    updateLockState();
    sendResponse({ ok: true });
  }
});

// ==================== Observers ====================

// Watch for DOM changes (TradingView is a SPA, order panels appear dynamically)
const observer = new MutationObserver(() => {
  updateLockState();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Backup interval — MutationObserver can miss some SPA transitions
setInterval(updateLockState, 2000);

// Initial scan
updateLockState();

console.log('[TDC] Content script loaded on TradingView');
