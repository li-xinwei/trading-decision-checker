import { useState, useCallback } from 'react';

const STORAGE_KEY = 'tp_auth';
const PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'trading2026';

function isAuthenticated(): boolean {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

export function useAuth() {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [error, setError] = useState('');

  const login = useCallback((password: string) => {
    if (password === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setAuthed(true);
      setError('');
      return true;
    }
    setError('密码错误');
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
  }, []);

  return { authed, error, login, logout };
}
