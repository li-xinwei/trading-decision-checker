import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

// Set env vars before importing the module
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

const { fetchSessions, insertSession, deleteAllSessions } = await import('./supabase');

const mockSession = {
  id: 'test-123',
  startTime: 1000,
  endTime: 2000,
  decisions: [
    { nodeId: 'q1', question: 'Direction?', answer: 'Long', category: 'Dir', timestamp: 1000 },
  ],
  result: { id: 'r1', type: 'go' as const, title: 'Go', message: 'ok', suggestions: ['a'] },
  tradeDirection: 'Long',
  pair: 'EURUSD',
};

describe('supabase data layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchSessions', () => {
    it('returns mapped sessions on success', async () => {
      const rows = [
        {
          id: 'test-123',
          start_time: 1000,
          end_time: 2000,
          decisions: mockSession.decisions,
          result: mockSession.result,
          trade_direction: 'Long',
          pair: 'EURUSD',
        },
      ];
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
          }),
        }),
      });

      const result = await fetchSessions();
      expect(result).toHaveLength(1);
      expect(result![0].id).toBe('test-123');
      expect(result![0].startTime).toBe(1000);
      expect(result![0].tradeDirection).toBe('Long');
      expect(mockFrom).toHaveBeenCalledWith('check_sessions');
    });

    it('returns null on error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
          }),
        }),
      });

      const result = await fetchSessions();
      expect(result).toBeNull();
    });
  });

  describe('insertSession', () => {
    it('returns true on success', async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const result = await insertSession(mockSession);
      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('check_sessions');
    });

    it('returns false on error', async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
      });

      const result = await insertSession(mockSession);
      expect(result).toBe(false);
    });
  });

  describe('deleteAllSessions', () => {
    it('returns true on success', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await deleteAllSessions();
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
        }),
      });

      const result = await deleteAllSessions();
      expect(result).toBe(false);
    });
  });
});
