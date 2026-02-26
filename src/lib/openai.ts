import type { Trade } from '../types/trading';
import type { TradeLog, TradeLogEntry } from '../types/tradingLog';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;

export async function formatDailySummary(
  rawNotes: string,
  trades: Trade[]
): Promise<string> {
  if (!API_KEY) {
    return fallbackFormat(rawNotes, trades);
  }

  const tradesInfo = trades
    .map(
      (t) =>
        `- ${t.direction} ${t.setupType} | 结果: ${t.result || '进行中'} | R: ${t.pnlRR ?? 'N/A'}`
    )
    .join('\n');

  const prompt = `你是一个专业的交易日记助手。请将以下交易员的原始笔记和当日交易数据，格式化为一份结构化的交易日记。

## 当日交易记录
${tradesInfo || '无交易记录'}

## 原始笔记
${rawNotes}

请按以下格式输出：
1. **今日概览** - 简短总结当日交易表现
2. **交易记录** - 每笔交易的简要回顾
3. **做得好的地方** - 值得继续保持的
4. **需要改进的地方** - 需要注意的问题
5. **明日计划** - 如果笔记中提到的话

保持语言简洁专业，使用中文。`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error('OpenAI API error:', res.status);
      return fallbackFormat(rawNotes, trades);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content || fallbackFormat(rawNotes, trades);
  } catch (err) {
    console.error('OpenAI request failed:', err);
    return fallbackFormat(rawNotes, trades);
  }
}

function fallbackFormat(rawNotes: string, trades: Trade[]): string {
  const lines: string[] = ['# 每日交易总结\n'];

  if (trades.length > 0) {
    lines.push('## 交易记录\n');
    for (const t of trades) {
      const resultEmoji =
        t.result === 'win' ? '✅' : t.result === 'loss' ? '❌' : '➖';
      lines.push(
        `- ${resultEmoji} **${t.direction} ${t.setupType}** — ${t.result || '进行中'} (${t.pnlRR != null ? t.pnlRR + 'R' : 'N/A'})`
      );
    }
    lines.push('');
  }

  lines.push('## 交易心得\n');
  lines.push(rawNotes);

  return lines.join('\n');
}

async function callOpenAI(prompt: string, maxTokens = 600): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export async function generateTradeInsights(log: TradeLog): Promise<string> {
  const entries = log.entries || [];
  const tradeLines = entries.map((e, i) => {
    const dir = e.sellPrice > e.buyPrice ? 'Long' : 'Short';
    return [
      `Trade ${i + 1}: ${dir} ${e.symbol} ${e.buyPrice}→${e.sellPrice}`,
      `  Net P/L: $${e.netPnl.toFixed(2)} | Duration: ${e.durationSecs ?? 0}s`,
      e.entryReason ? `  Entry: ${e.entryReason}` : '',
      e.exitReason ? `  Exit: ${e.exitReason}` : '',
      e.reflection ? `  Reflection: ${e.reflection}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  const prompt = `你是一个专业的期货交易教练，专注于 MES（Micro E-mini S&P 500）日内交易。
分析以下 ${log.date} 的交易记录，给出 3-4 条简洁、有针对性的 coaching 建议。
重点关注：进出场时机、风险管理、情绪控制。

${tradeLines}

当日净盈亏: $${log.netPnl.toFixed(2)}

请用中文，每条建议一段，总字数控制在 200 字以内。`;

  const result = await callOpenAI(prompt, 500);
  return result ?? `当日净盈亏 $${log.netPnl.toFixed(2)}。继续保持日志记录，数据积累后 AI 分析会更有针对性。`;
}

export async function generateOverallInsights(
  logs: TradeLog[],
  entries: TradeLogEntry[]
): Promise<string> {
  const totalNet = logs.reduce((s, l) => s + l.netPnl, 0);
  const winDays = logs.filter((l) => l.netPnl > 0).length;
  const winTrades = entries.filter((e) => e.netPnl > 0).length;
  const avgTrade = entries.length > 0 ? totalNet / entries.length : 0;

  // Collect unique entry reasons for pattern analysis
  const reasons = entries
    .map((e) => e.entryReason)
    .filter(Boolean)
    .slice(0, 20)
    .join('; ');

  const prompt = `你是一个专业的期货交易教练，专注于 MES 日内交易。
根据以下统计数据，给出 4-5 条系统性的 coaching 建议，帮助交易员改进交易系统。

统计摘要：
- 总交易天数: ${logs.length}，胜率: ${logs.length > 0 ? Math.round(winDays / logs.length * 100) : 0}%
- 总交易笔数: ${entries.length}，单笔胜率: ${entries.length > 0 ? Math.round(winTrades / entries.length * 100) : 0}%
- 净总盈亏: $${totalNet.toFixed(2)}
- 平均每笔: $${avgTrade.toFixed(2)}
${reasons ? `\n常见进场理由: ${reasons}` : ''}

请用中文，分析交易模式的优势和薄弱环节，给出具体可执行的建议。总字数 300 字以内。`;

  const result = await callOpenAI(prompt, 700);
  return result ?? '数据积累中，建议继续记录更多交易并添加进出场理由，以便 AI 进行更深入的模式分析。';
}
