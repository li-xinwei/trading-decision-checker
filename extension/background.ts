// Background Service Worker — MV3
// 1. Opens Side Panel when extension icon is clicked
// 2. Relays CHECK_PASSED / CHECK_RESET from Side Panel to TradingView content scripts

// ==================== Side Panel Toggle ====================

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err: unknown) => console.error('[TDC] Failed to set panel behavior:', err));

// ==================== Message Relay ====================

const TRADINGVIEW_URL_PATTERN = 'https://*.tradingview.com/*';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only relay messages that come from the Side Panel (no sender.tab means extension context)
  if (sender.tab) return;

  if (message.type === 'CHECK_PASSED' || message.type === 'CHECK_RESET') {
    // Broadcast to all TradingView tabs
    chrome.tabs.query({ url: TRADINGVIEW_URL_PATTERN }, (tabs) => {
      for (const tab of tabs) {
        if (tab.id != null) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {
            // Tab might not have content script loaded yet — ignore
          });
        }
      }
    });
    sendResponse({ ok: true });
  }
});

console.log('[TDC] Background service worker loaded');
