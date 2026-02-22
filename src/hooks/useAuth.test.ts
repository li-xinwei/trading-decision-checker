import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.stubEnv('VITE_APP_PASSWORD', 'testpass123');

const { useAuth } = await import('./useAuth');

describe('useAuth', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.authed).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('login succeeds with correct password', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      const ok = result.current.login('testpass123');
      expect(ok).toBe(true);
    });

    expect(result.current.authed).toBe(true);
    expect(result.current.error).toBe('');
  });

  it('login fails with wrong password', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      const ok = result.current.login('wrong');
      expect(ok).toBe(false);
    });

    expect(result.current.authed).toBe(false);
    expect(result.current.error).toBe('密码错误');
  });

  it('logout clears auth state', () => {
    const { result } = renderHook(() => useAuth());

    act(() => result.current.login('testpass123'));
    expect(result.current.authed).toBe(true);

    act(() => result.current.logout());
    expect(result.current.authed).toBe(false);
  });

  it('persists auth in sessionStorage', () => {
    const { result } = renderHook(() => useAuth());

    act(() => result.current.login('testpass123'));

    const { result: result2 } = renderHook(() => useAuth());
    expect(result2.current.authed).toBe(true);
  });

  it('logout removes sessionStorage entry', () => {
    const { result } = renderHook(() => useAuth());

    act(() => result.current.login('testpass123'));
    act(() => result.current.logout());

    const { result: result2 } = renderHook(() => useAuth());
    expect(result2.current.authed).toBe(false);
  });
});
