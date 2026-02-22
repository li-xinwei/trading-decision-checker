import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Trade } from '../types/trading';

vi.stubEnv('VITE_OPENAI_API_KEY', '');

const { formatDailySummary } = await import('./openai');

const mockTrades: Trade[] = [
  {
    id: 't1',
    sessionId: 's1',
    setupType: '回调setup',
    direction: '做多',
    status: 'closed',
    result: 'win',
    pnlRR: 1.5,
    openedAt: Date.now(),
    closedAt: Date.now(),
  },
  {
    id: 't2',
    sessionId: 's1',
    setupType: '突破setup',
    direction: '做空',
    status: 'closed',
    result: 'loss',
    pnlRR: -1,
    openedAt: Date.now(),
    closedAt: Date.now(),
  },
];

describe('formatDailySummary (fallback mode, no API key)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('produces markdown output with trades and notes', async () => {
    const result = await formatDailySummary('今天做得不错', mockTrades);

    expect(result).toContain('每日交易总结');
    expect(result).toContain('交易记录');
    expect(result).toContain('回调setup');
    expect(result).toContain('突破setup');
    expect(result).toContain('做多');
    expect(result).toContain('做空');
    expect(result).toContain('今天做得不错');
  });

  it('handles empty trades', async () => {
    const result = await formatDailySummary('没有交易', []);

    expect(result).toContain('每日交易总结');
    expect(result).toContain('没有交易');
    expect(result).not.toContain('交易记录');
  });

  it('shows win/loss emojis correctly', async () => {
    const result = await formatDailySummary('test', mockTrades);

    expect(result).toContain('✅');
    expect(result).toContain('❌');
  });
});
