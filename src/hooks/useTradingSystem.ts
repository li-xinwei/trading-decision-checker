import { useState, useEffect, useCallback } from 'react';
import type { TradingSystemData } from '../types/decisionTree';
import { fetchTradingSystem, saveTradingSystem } from '../lib/supabase';
import { getDefaultTradingSystem } from '../data/defaultSystem';

const LOCAL_KEY = 'trading_system_data';

function loadLocal(): TradingSystemData | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocal(data: TradingSystemData) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

export function useTradingSystem() {
  const [system, setSystem] = useState<TradingSystemData>(() => {
    return loadLocal() || getDefaultTradingSystem();
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchTradingSystem().then((remote) => {
      if (remote) {
        setSystem(remote);
        saveLocal(remote);
      }
    });
  }, []);

  const updateSystem = useCallback((updater: (prev: TradingSystemData) => TradingSystemData) => {
    setSystem((prev) => {
      const next = updater(prev);
      setDirty(true);
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    saveLocal(system);
    await saveTradingSystem(system);
    setDirty(false);
    setSaving(false);
  }, [system]);

  return { system, updateSystem, save, saving, dirty };
}
