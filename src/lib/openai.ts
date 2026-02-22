import type { Trade } from '../types/trading';

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
