// Minimal Supabase REST client for the extension (no SDK dependency).
// Hardcoded URL + anon key — personal use only.
// The anon key provides read-only access via RLS policies.

import type { TradingSystemData } from './types';

const SUPABASE_URL = 'https://thwqzrxakrplxsiahili.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRod3F6cnhha3JwbHhzaWFoaWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTQ1NjUsImV4cCI6MjA4NzE5MDU2NX0.TtUQMtdizO7q101HC4DQiO79y74nBcaIbKnXhmVlnms';

const SYSTEM_ID = 'default';
const CACHE_KEY = 'tdc_trading_system';

export async function fetchTradingSystem(): Promise<TradingSystemData | null> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/trading_systems?id=eq.${SYSTEM_ID}&select=data`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.error('[TDC] Supabase fetch failed:', res.status);
      return null;
    }
    const rows: Array<{ data: TradingSystemData }> = await res.json();
    if (rows.length === 0) return null;
    return rows[0].data;
  } catch (err) {
    console.error('[TDC] Supabase fetch error:', err);
    return null;
  }
}

export async function loadSystemData(): Promise<TradingSystemData | null> {
  // 1. Try chrome.storage.local cache first
  const cached = await getCached();
  if (cached) {
    // Refresh in background (don't block)
    refreshCache();
    return cached;
  }

  // 2. No cache — fetch from Supabase
  const remote = await fetchTradingSystem();
  if (remote) {
    await setCache(remote);
  }
  return remote;
}

async function getCached(): Promise<TradingSystemData | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(CACHE_KEY, (result) => {
      resolve(result[CACHE_KEY] ?? null);
    });
  });
}

async function setCache(data: TradingSystemData): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [CACHE_KEY]: data }, resolve);
  });
}

async function refreshCache(): Promise<void> {
  const remote = await fetchTradingSystem();
  if (remote) {
    await setCache(remote);
  }
}
