// CrossTrade REST API client for NinjaTrader 8 position detection.
// Config (secret key + account name) stored in chrome.storage.sync.
// No token renewal needed — secret key is used directly as Bearer token.

import type { CrossTradeConfig, CrossTradePosition } from './types';

const BASE_URL = 'https://app.crosstrade.io/v1/api';
const CONFIG_KEY = 'tdc_crosstrade_config';

// ==================== Config ====================

export async function getConfig(): Promise<CrossTradeConfig | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(CONFIG_KEY, (result) => {
      resolve(result[CONFIG_KEY] ?? null);
    });
  });
}

export async function saveConfig(config: CrossTradeConfig): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [CONFIG_KEY]: config }, resolve);
  });
}

// ==================== Positions ====================

async function fetchPositions(config: CrossTradeConfig): Promise<CrossTradePosition[] | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/accounts/${encodeURIComponent(config.accountName)}/positions`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.secretKey}`,
        },
      }
    );

    if (!res.ok) {
      console.error('[TDC] CrossTrade positions failed:', res.status);
      return null;
    }

    const data: { positions: CrossTradePosition[]; success: boolean } = await res.json();
    if (!data.success) return null;
    return data.positions;
  } catch (err) {
    console.error('[TDC] CrossTrade positions error:', err);
    return null;
  }
}

/**
 * Check if there are open positions via CrossTrade API.
 * Returns true/false on success, or null if API is unavailable
 * (no config, auth failed, NT8 not running, etc.).
 * Caller should fallback to DOM detection when null is returned.
 */
export async function crosstradeHasPositions(): Promise<boolean | null> {
  const config = await getConfig();
  if (!config || !config.secretKey || !config.accountName) return null;

  const positions = await fetchPositions(config);
  if (positions === null) return null;
  return positions.length > 0;
}

/**
 * Test connectivity with given config (used by Options page).
 * Calls GET /accounts to verify the secret key works.
 */
export async function testConnection(
  config: CrossTradeConfig
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/accounts`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.secretKey}`,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${text}` };
    }

    const data = await res.json();
    if (!data.success) {
      return { ok: false, error: 'API returned success: false' };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
