import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { fetchTradeLogs, fetchTradeLogWithEntries } from '../lib/tradingLog';
import { generateOverallInsights } from '../lib/openai';
import type { TradeLog, TradeLogEntry } from '../types/tradingLog';

type Period = 'month' | 'all';

function pnlClass(v: number) {
  if (v > 0) return 'pnl-positive';
  if (v < 0) return 'pnl-negative';
  return 'pnl-flat';
}

function pnlStr(v: number) {
  const sign = v >= 0 ? '+' : '';
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

export function LogAnalyticsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [allEntries, setAllEntries] = useState<TradeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const load = async () => {
      const rawLogs = await fetchTradeLogs();
      setLogs(rawLogs);

      // Load all entries for deeper analytics
      const entryPromises = rawLogs.map((l) => fetchTradeLogWithEntries(l.id));
      const full = await Promise.all(entryPromises);
      const entries = full.flatMap((l) => l?.entries || []);
      setAllEntries(entries);
      setLoading(false);
    };
    load();
  }, []);

  const cutoff = useMemo(() => {
    if (period === 'all') return '';
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }, [period]);

  const filteredLogs = useMemo(
    () => (cutoff ? logs.filter((l) => l.date >= cutoff) : logs),
    [logs, cutoff]
  );

  const filteredEntries = useMemo(
    () => (cutoff ? allEntries.filter((e) => {
      const date = e.buyTime.split(' ')[0]; // "01/12/2026"
      const parts = date.split('/');
      const iso = `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
      return iso >= cutoff;
    }) : allEntries),
    [allEntries, cutoff]
  );

  // ── Cumulative equity curve ──────────────────────────────────────────────
  const equityCurve = useMemo(() => {
    const sorted = [...filteredLogs].sort((a, b) => a.date.localeCompare(b.date));
    let cum = 0;
    return sorted.map((l) => {
      cum += l.netPnl;
      return { date: l.date.slice(5), pnl: +cum.toFixed(2) };
    });
  }, [filteredLogs]);

  // ── Daily P/L bar ────────────────────────────────────────────────────────
  const dailyBars = useMemo(() => {
    const sorted = [...filteredLogs].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((l) => ({ date: l.date.slice(5), pnl: l.netPnl }));
  }, [filteredLogs]);

  // ── Summary stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalNet = filteredLogs.reduce((s, l) => s + l.netPnl, 0);
    const totalFees = filteredLogs.reduce((s, l) => s + l.feesTotal, 0);
    const winDays = filteredLogs.filter((l) => l.netPnl > 0).length;
    const lossDays = filteredLogs.filter((l) => l.netPnl < 0).length;
    const totalTrades = filteredEntries.length;
    const winTrades = filteredEntries.filter((e) => e.netPnl > 0).length;
    const avgTrade = totalTrades > 0 ? totalNet / totalTrades : 0;

    // Max drawdown
    let peak = 0, maxDD = 0, running = 0;
    [...filteredLogs].sort((a, b) => a.date.localeCompare(b.date)).forEach((l) => {
      running += l.netPnl;
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDD) maxDD = dd;
    });

    // Best / worst day
    const sorted = [...filteredLogs].sort((a, b) => b.netPnl - a.netPnl);
    const bestDay = sorted[0];
    const worstDay = sorted[sorted.length - 1];

    // Avg win / avg loss
    const winEntries = filteredEntries.filter((e) => e.netPnl > 0);
    const lossEntries = filteredEntries.filter((e) => e.netPnl < 0);
    const avgWin = winEntries.length ? winEntries.reduce((s, e) => s + e.netPnl, 0) / winEntries.length : 0;
    const avgLoss = lossEntries.length ? lossEntries.reduce((s, e) => s + e.netPnl, 0) / lossEntries.length : 0;

    return {
      totalNet, totalFees, winDays, lossDays,
      totalTrades, winTrades, avgTrade, maxDD,
      bestDay, worstDay, avgWin, avgLoss,
      dayCount: filteredLogs.length,
      dayWinRate: filteredLogs.length > 0 ? Math.round(winDays / filteredLogs.length * 100) : 0,
      tradeWinRate: totalTrades > 0 ? Math.round(winTrades / totalTrades * 100) : 0,
    };
  }, [filteredLogs, filteredEntries]);

  const handleAiInsight = async () => {
    setLoadingInsight(true);
    try {
      const insight = await generateOverallInsights(filteredLogs, filteredEntries);
      setAiInsight(insight);
    } finally {
      setLoadingInsight(false);
    }
  };

  const tooltipStyle = {
    background: '#1c1c1e',
    border: '1px solid rgba(84,84,88,0.36)',
    borderRadius: 8,
    fontSize: 12,
    color: '#f0f0f5',
  };

  return (
    <div className="analytics-page">
      <header className="page-header">
        <div className="page-header-left">
          <button className="page-back-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={18} />
            返回
          </button>
        </div>
        <span className="page-title">统计分析</span>
        <div className="header-actions" />
      </header>

      <div className="analytics-content">
        <div className="analytics-filter-bar">
          {(['month', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              className={`analytics-filter-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'month' ? '近30天' : '全部'}
            </button>
          ))}
        </div>

        {loading && <div className="analytics-loading">加载中...</div>}

        {!loading && filteredLogs.length === 0 && (
          <div className="analytics-empty">
            <p>暂无数据</p>
            <p className="analytics-empty-sub">上传 performance.csv 后数据会出现在这里</p>
          </div>
        )}

        {!loading && filteredLogs.length > 0 && (
          <>
            {/* ── Stat cards ─────────────────────────────── */}
            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-label">净盈亏</span>
                <span className={`stat-value ${pnlClass(stats.totalNet)}`}>
                  {pnlStr(stats.totalNet)}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">交易天数胜率</span>
                <span className="stat-value">{stats.dayWinRate}%</span>
                <span className="stat-sub">{stats.winDays}W / {stats.lossDays}L</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">单笔胜率</span>
                <span className="stat-value">{stats.tradeWinRate}%</span>
                <span className="stat-sub">{stats.winTrades}/{stats.totalTrades} trades</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">平均每笔</span>
                <span className={`stat-value ${pnlClass(stats.avgTrade)}`}>
                  {pnlStr(stats.avgTrade)}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">总手续费</span>
                <span className="stat-value pnl-negative">−${stats.totalFees.toFixed(2)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">最大回撤</span>
                <span className="stat-value pnl-negative">−${stats.maxDD.toFixed(2)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">平均盈利笔</span>
                <span className="stat-value pnl-positive">{pnlStr(stats.avgWin)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">平均亏损笔</span>
                <span className="stat-value pnl-negative">{pnlStr(stats.avgLoss)}</span>
              </div>
            </div>

            {/* ── Best / Worst ───────────────────────────── */}
            <div className="best-worst-row">
              {stats.bestDay && (
                <div className="best-worst-card win">
                  <span className="bw-label">最佳交易日</span>
                  <span className="bw-date">{stats.bestDay.date}</span>
                  <span className="bw-pnl pnl-positive">{pnlStr(stats.bestDay.netPnl)}</span>
                </div>
              )}
              {stats.worstDay && (
                <div className="best-worst-card loss">
                  <span className="bw-label">最差交易日</span>
                  <span className="bw-date">{stats.worstDay.date}</span>
                  <span className="bw-pnl pnl-negative">{pnlStr(stats.worstDay.netPnl)}</span>
                </div>
              )}
            </div>

            {/* ── Equity curve ──────────────────────────── */}
            <div className="chart-card">
              <h4>累计净盈亏曲线</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(118,118,128,0.12)" />
                  <XAxis dataKey="date" tick={{ fill: '#636366', fontSize: 10 }} stroke="rgba(118,118,128,0.2)" />
                  <YAxis tick={{ fill: '#636366', fontSize: 10 }} stroke="rgba(118,118,128,0.2)" tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`$${v ?? 0}`, 'Cumulative']} />
                  <ReferenceLine y={0} stroke="rgba(118,118,128,0.3)" />
                  <Line type="monotone" dataKey="pnl" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── Daily bars ────────────────────────────── */}
            <div className="chart-card">
              <h4>每日盈亏</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyBars} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(118,118,128,0.12)" />
                  <XAxis dataKey="date" tick={{ fill: '#636366', fontSize: 10 }} stroke="rgba(118,118,128,0.2)" />
                  <YAxis tick={{ fill: '#636366', fontSize: 10 }} stroke="rgba(118,118,128,0.2)" tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`$${v ?? 0}`, 'Net P/L']} />
                  <ReferenceLine y={0} stroke="rgba(118,118,128,0.3)" />
                  <Bar
                    dataKey="pnl"
                    radius={[3, 3, 0, 0]}
                    fill="#3b82f6"
                    // color each bar by sign
                    label={false}
                  >
                    {dailyBars.map((entry, index) => (
                      <rect
                        key={index}
                        fill={entry.pnl >= 0 ? '#34d399' : '#f87171'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── AI Overall Insights ───────────────────── */}
            <div className="chart-card ai-overall-card">
              <div className="ai-overall-header">
                <h4>AI 整体分析</h4>
                {!aiInsight && (
                  <button
                    className="btn-ghost ai-insight-btn"
                    onClick={handleAiInsight}
                    disabled={loadingInsight}
                  >
                    <Sparkles size={14} />
                    {loadingInsight ? '分析中...' : '生成 Insights'}
                  </button>
                )}
              </div>
              {aiInsight ? (
                <div className="ai-insight-text">{aiInsight}</div>
              ) : (
                <p className="ai-overall-placeholder">
                  点击生成 AI 对你近期交易的整体分析与建议
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
