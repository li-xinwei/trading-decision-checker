import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useLogout } from '../hooks/useAuth';
import { fetchAllTrades } from '../lib/supabase';
import type { Trade } from '../types/trading';

type TimeFilter = 'week' | 'month' | 'all';

const COLORS = [
  '#0a84ff',
  '#30d158',
  '#ff9f0a',
  '#ff453a',
  '#bf5af2',
  '#64d2ff',
  '#ffd60a',
];

export function AnalyticsPage() {
  const navigate = useNavigate();
  const logout = useLogout();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  useEffect(() => {
    fetchAllTrades().then((t) => {
      setTrades(t);
      setLoading(false);
    });
  }, []);

  const filteredTrades = useMemo(() => {
    const now = Date.now();
    return trades.filter((t) => {
      if (t.status !== 'closed') return false;
      if (timeFilter === 'week') return now - t.openedAt < 7 * 86400000;
      if (timeFilter === 'month') return now - t.openedAt < 30 * 86400000;
      return true;
    });
  }, [trades, timeFilter]);

  const setupStats = useMemo(() => {
    const map = new Map<
      string,
      { total: number; wins: number; totalRR: number; reviews: string[] }
    >();
    for (const t of filteredTrades) {
      const key = t.setupType;
      const stat = map.get(key) || { total: 0, wins: 0, totalRR: 0, reviews: [] };
      stat.total++;
      if (t.result === 'win') stat.wins++;
      if (t.pnlRR != null) stat.totalRR += t.pnlRR;
      if (t.review) stat.reviews.push(t.review);
      map.set(key, stat);
    }
    return Array.from(map.entries()).map(([name, s]) => ({
      name,
      total: s.total,
      wins: s.wins,
      winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
      avgRR: s.total > 0 ? +(s.totalRR / s.total).toFixed(2) : 0,
      totalRR: +s.totalRR.toFixed(2),
      reviews: s.reviews,
    }));
  }, [filteredTrades]);

  const pieData = setupStats.map((s) => ({
    name: s.name,
    value: s.total,
  }));

  const cumulativeRR = useMemo(() => {
    const sorted = [...filteredTrades].sort((a, b) => a.openedAt - b.openedAt);
    let cumRR = 0;
    return sorted.map((t) => {
      cumRR += t.pnlRR || 0;
      return {
        date: new Date(t.openedAt).toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
        }),
        rr: +cumRR.toFixed(2),
      };
    });
  }, [filteredTrades]);

  const totalWins = filteredTrades.filter((t) => t.result === 'win').length;
  const totalLosses = filteredTrades.filter((t) => t.result === 'loss').length;
  const overallWinRate =
    filteredTrades.length > 0
      ? Math.round((totalWins / filteredTrades.length) * 100)
      : 0;
  const overallRR = filteredTrades.reduce((sum, t) => sum + (t.pnlRR || 0), 0);

  return (
    <div className="analytics-page">
      <header className="page-header">
        <div className="page-header-left">
          <button className="page-back-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={18} />
            返回
          </button>
        </div>
        <span className="page-title">系统复盘</span>
        <div className="header-actions">
          <button className="header-btn" onClick={logout} title="登出">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="analytics-content">
        <div className="analytics-filter-bar">
          {(['week', 'month', 'all'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              className={`analytics-filter-btn ${timeFilter === f ? 'active' : ''}`}
              onClick={() => setTimeFilter(f)}
            >
              {f === 'week' ? '本周' : f === 'month' ? '本月' : '全部'}
            </button>
          ))}
        </div>

        {loading && <div className="analytics-loading">加载中...</div>}

        {!loading && filteredTrades.length === 0 && (
          <div className="analytics-empty">
            <p>暂无交易数据</p>
            <p className="analytics-empty-sub">完成交易并平仓后数据会显示在这里</p>
          </div>
        )}

        {!loading && filteredTrades.length > 0 && (
          <>
            <div className="analytics-overview">
              <div className="stat-card">
                <span className="stat-label">总交易</span>
                <span className="stat-value">{filteredTrades.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">胜率</span>
                <span className="stat-value">{overallWinRate}%</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">总盈亏</span>
                <span className={`stat-value ${overallRR >= 0 ? 'positive' : 'negative'}`}>
                  {overallRR >= 0 ? '+' : ''}
                  {overallRR.toFixed(1)}R
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">胜/负</span>
                <span className="stat-value">
                  {totalWins}W / {totalLosses}L
                </span>
              </div>
            </div>

            <div className="analytics-charts">
              <div className="chart-card">
                <h4>累计盈亏曲线 (R)</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={cumulativeRR}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(118,118,128,0.12)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#636366', fontSize: 11 }}
                      stroke="rgba(118,118,128,0.2)"
                    />
                    <YAxis
                      tick={{ fill: '#636366', fontSize: 11 }}
                      stroke="rgba(118,118,128,0.2)"
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1c1c1e',
                        border: '1px solid rgba(84,84,88,0.36)',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rr"
                      stroke="#0a84ff"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h4>Setup 使用分布</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1c1c1e',
                        border: '1px solid rgba(84,84,88,0.36)',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card full-width">
                <h4>各 Setup 胜率与平均盈亏</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={setupStats}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(118,118,128,0.12)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#636366', fontSize: 11 }}
                      stroke="rgba(118,118,128,0.2)"
                    />
                    <YAxis
                      tick={{ fill: '#636366', fontSize: 11 }}
                      stroke="rgba(118,118,128,0.2)"
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1c1c1e',
                        border: '1px solid rgba(84,84,88,0.36)',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    />
                    <Bar
                      dataKey="winRate"
                      name="胜率 %"
                      fill="#30d158"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="avgRR"
                      name="平均 R"
                      fill="#0a84ff"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="setup-breakdown">
              <h4>各 Setup 详细统计</h4>
              {setupStats.map((s) => (
                <div key={s.name} className="setup-stat-card">
                  <div className="setup-stat-header">
                    <span className="setup-stat-name">{s.name}</span>
                    <span className="setup-stat-count">{s.total} 笔</span>
                  </div>
                  <div className="setup-stat-row">
                    <div className="setup-stat-item">
                      <span className="stat-mini-label">胜率</span>
                      <span className="stat-mini-value">{s.winRate}%</span>
                    </div>
                    <div className="setup-stat-item">
                      <span className="stat-mini-label">平均 R</span>
                      <span className="stat-mini-value">{s.avgRR}</span>
                    </div>
                    <div className="setup-stat-item">
                      <span className="stat-mini-label">总 R</span>
                      <span
                        className={`stat-mini-value ${s.totalRR >= 0 ? 'positive' : 'negative'}`}
                      >
                        {s.totalRR >= 0 ? '+' : ''}
                        {s.totalRR}
                      </span>
                    </div>
                  </div>
                  {s.reviews.length > 0 && (
                    <div className="setup-reviews">
                      <span className="reviews-label">复盘笔记</span>
                      {s.reviews.slice(0, 3).map((r, i) => (
                        <p key={i} className="review-snippet">
                          {r}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
