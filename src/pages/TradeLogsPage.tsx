import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Upload,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  parseCsv,
  buildLogFromCsvRows,
  saveTradeLog,
  fetchTradeLogs,
  fetchTradeLogWithEntries,
  updateEntryAnnotations,
  updateLogSummaryNote,
  deleteTradeLog,
} from '../lib/tradingLog';
import { generateTradeInsights } from '../lib/openai';
import type { TradeLog, TradeLogEntry } from '../types/tradingLog';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pnlClass(v: number) {
  if (v > 0) return 'pnl-positive';
  if (v < 0) return 'pnl-negative';
  return 'pnl-flat';
}

function pnlStr(v: number) {
  const sign = v >= 0 ? '+' : '';
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

function formatDuration(secs?: number): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(raw: string): string {
  // "01/12/2026 23:56:03" → "23:56"
  const parts = raw.split(' ');
  if (parts.length < 2) return raw;
  return parts[1].slice(0, 5);
}

// ─── Upload Zone ─────────────────────────────────────────────────────────────
function UploadZone({ onFile }: { onFile: (text: string, name: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const read = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => onFile(e.target?.result as string, file.name);
    reader.readAsText(file);
  };

  return (
    <div
      className={`upload-zone ${dragging ? 'dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file?.name.endsWith('.csv')) read(file);
      }}
    >
      <Upload size={22} className="upload-zone-icon" />
      <p className="upload-zone-text">拖拽 performance.csv 到此处</p>
      <p className="upload-zone-sub">或点击选择文件</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) read(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ─── CSV Preview Modal ────────────────────────────────────────────────────────
function CsvPreviewModal({
  log,
  onConfirm,
  onCancel,
  saving,
}: {
  log: TradeLog;
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">确认导入 — {log.date}</span>
          <span className={`modal-pnl ${pnlClass(log.netPnl)}`}>{pnlStr(log.netPnl)} net</span>
        </div>

        <div className="modal-meta">
          <span>{log.tradeCount} 笔交易</span>
          <span>Gross {pnlStr(log.grossPnl)}</span>
          <span>Fees −${log.feesTotal.toFixed(2)}</span>
        </div>

        <div className="modal-entries">
          {(log.entries || []).map((e, i) => (
            <div key={e.id} className="modal-entry-row">
              <span className="modal-entry-num">{i + 1}</span>
              <span className="modal-entry-symbol">{e.symbol}</span>
              <span className="modal-entry-times">
                {formatTime(e.buyTime)} → {formatTime(e.sellTime)}
              </span>
              <span className="modal-entry-dur">{formatDuration(e.durationSecs)}</span>
              <span className={`modal-entry-pnl ${pnlClass(e.netPnl)}`}>{pnlStr(e.netPnl)}</span>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel} disabled={saving}>取消</button>
          <button className="btn-primary" onClick={onConfirm} disabled={saving}>
            {saving ? '保存中...' : '确认导入'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline text field ────────────────────────────────────────────────────────
function InlineField({
  label,
  value,
  placeholder,
  onSave,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  // key prop on InlineField callers resets this when value changes from parent
  const [draft, setDraft] = useState(value || '');
  const taRef = useRef<HTMLTextAreaElement>(null);

  const commit = () => {
    setEditing(false);
    onSave(draft);
  };

  if (editing) {
    return (
      <div className="inline-field editing">
        <span className="inline-field-label">{label}</span>
        <textarea
          ref={taRef}
          autoFocus
          className="inline-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Escape') commit(); }}
          rows={2}
        />
      </div>
    );
  }

  return (
    <div className="inline-field" onClick={() => setEditing(true)}>
      <span className="inline-field-label">{label}</span>
      {draft ? (
        <span className="inline-field-value">{draft}</span>
      ) : (
        <span className="inline-field-placeholder">{placeholder}</span>
      )}
    </div>
  );
}

// ─── Single trade entry card ──────────────────────────────────────────────────
function EntryCard({
  entry,
  index,
  onAnnotate,
}: {
  entry: TradeLogEntry;
  index: number;
  onAnnotate: (id: string, patch: Partial<TradeLogEntry>) => void;
}) {
  const fb = entry.feeBreakdown;
  const isLong = entry.sellPrice > entry.buyPrice;

  return (
    <div className={`entry-card ${entry.netPnl >= 0 ? 'entry-win' : 'entry-loss'}`}>
      <div className="entry-card-header">
        <div className="entry-card-left">
          <span className="entry-index">{index + 1}</span>
          <span className="entry-symbol">{entry.symbol}</span>
          <span className={`entry-direction ${isLong ? 'long' : 'short'}`}>
            {isLong ? '▲ Long' : '▼ Short'}
          </span>
          <span className="entry-qty">×{entry.qty}</span>
        </div>
        <span className={`entry-net-pnl ${pnlClass(entry.netPnl)}`}>
          {pnlStr(entry.netPnl)}
        </span>
      </div>

      <div className="entry-prices">
        <div className="price-row">
          <span className="price-label">Buy</span>
          <span className="price-val">{entry.buyPrice.toFixed(2)}</span>
          <span className="price-time">{formatTime(entry.buyTime)}</span>
        </div>
        <div className="price-row">
          <span className="price-label">Sell</span>
          <span className="price-val">{entry.sellPrice.toFixed(2)}</span>
          <span className="price-time">{formatTime(entry.sellTime)}</span>
        </div>
        <div className="price-row">
          <span className="price-label">Duration</span>
          <span className="price-val">{formatDuration(entry.durationSecs)}</span>
        </div>
      </div>

      <div className="entry-pnl-breakdown">
        <div className="pnl-row">
          <span>Gross P/L</span>
          <span className={pnlClass(entry.grossPnl)}>{pnlStr(entry.grossPnl)}</span>
        </div>
        <div className="pnl-row fees">
          <span>Fees</span>
          <span>−${entry.fees.toFixed(2)}</span>
          {fb && fb.sides > 0 && (
            <span className="fee-detail">
              Comm ${fb.commission.toFixed(2)} · Exch ${fb.exchange.toFixed(2)} · NFA ${fb.nfa.toFixed(2)} · Clr ${fb.clearing.toFixed(2)}
            </span>
          )}
        </div>
        <div className="pnl-row net">
          <span>Net P/L</span>
          <span className={pnlClass(entry.netPnl)}>{pnlStr(entry.netPnl)}</span>
        </div>
      </div>

      <div className="entry-annotations">
        <InlineField
          key={`entry-${entry.id}`}
          label="Entry reason"
          value={entry.entryReason}
          placeholder="点击填写进场理由..."
          onSave={(v) => onAnnotate(entry.id, { entryReason: v })}
        />
        <InlineField
          key={`exit-${entry.id}`}
          label="Exit reason"
          value={entry.exitReason}
          placeholder="点击填写出场理由..."
          onSave={(v) => onAnnotate(entry.id, { exitReason: v })}
        />
        <InlineField
          key={`reflect-${entry.id}`}
          label="Reflection"
          value={entry.reflection}
          placeholder="点击填写复盘反思..."
          onSave={(v) => onAnnotate(entry.id, { reflection: v })}
        />
      </div>
    </div>
  );
}

// ─── Day log row ──────────────────────────────────────────────────────────────
function DayLogRow({
  log,
  onDelete,
}: {
  log: TradeLog;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fullLog, setFullLog] = useState<TradeLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  const handleExpand = async () => {
    if (!expanded && !fullLog) {
      setLoading(true);
      const data = await fetchTradeLogWithEntries(log.id);
      setFullLog(data);
      setLoading(false);
    }
    setExpanded((v) => !v);
  };

  const handleAnnotate = useCallback(
    async (entryId: string, patch: Partial<TradeLogEntry>) => {
      if (!fullLog) return;
      // Optimistic update
      setFullLog((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: prev.entries?.map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
        };
      });
      await updateEntryAnnotations(entryId, {
        entryReason: patch.entryReason,
        exitReason: patch.exitReason,
        reflection: patch.reflection,
      });
    },
    [fullLog]
  );

  const handleSummaryNote = useCallback(
    async (note: string) => {
      await updateLogSummaryNote(log.id, note);
    },
    [log.id]
  );

  const handleDelete = async () => {
    if (!confirm(`删除 ${log.date} 的交易记录？`)) return;
    setDeleting(true);
    await deleteTradeLog(log.id);
    onDelete(log.id);
  };

  const handleAiInsight = async () => {
    if (!fullLog?.entries?.length) return;
    setLoadingInsight(true);
    try {
      const insight = await generateTradeInsights(fullLog);
      setAiInsight(insight);
    } finally {
      setLoadingInsight(false);
    }
  };

  const PnlIcon = log.netPnl > 0 ? TrendingUp : log.netPnl < 0 ? TrendingDown : Minus;

  return (
    <div className={`day-log-row ${log.netPnl >= 0 ? 'day-win' : 'day-loss'}`}>
      <div className="day-log-summary" onClick={handleExpand}>
        <div className="day-log-left">
          <PnlIcon size={15} className={`day-trend-icon ${pnlClass(log.netPnl)}`} />
          <span className="day-date">{log.date}</span>
          <span className="day-trade-count">{log.tradeCount} trades</span>
        </div>
        <div className="day-log-right">
          <span className={`day-pnl ${pnlClass(log.netPnl)}`}>{pnlStr(log.netPnl)}</span>
          <button
            className="day-delete-btn"
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            disabled={deleting}
            title="删除"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      {expanded && (
        <div className="day-log-detail animate-in">
          {loading && <p className="detail-loading">加载中...</p>}

          {fullLog && (
            <>
              <div className="day-detail-meta">
                <span>Gross {pnlStr(fullLog.grossPnl)}</span>
                <span>Fees −${fullLog.feesTotal.toFixed(2)}</span>
                <span>Net {pnlStr(fullLog.netPnl)}</span>
              </div>

              <InlineField
                label="日总结"
                value={fullLog.summaryNote}
                placeholder="点击填写当日总结..."
                onSave={handleSummaryNote}
              />

              <div className="day-entries">
                {(fullLog.entries || []).map((e, i) => (
                  <EntryCard
                    key={e.id}
                    entry={e}
                    index={i}
                    onAnnotate={handleAnnotate}
                  />
                ))}
              </div>

              <div className="day-ai-section">
                {aiInsight ? (
                  <div className="ai-insight-box">
                    <span className="ai-insight-label">
                      <Sparkles size={12} /> AI Insight
                    </span>
                    <p className="ai-insight-text">{aiInsight}</p>
                  </div>
                ) : (
                  <button
                    className="btn-ghost ai-insight-btn"
                    onClick={handleAiInsight}
                    disabled={loadingInsight}
                  >
                    <Sparkles size={14} />
                    {loadingInsight ? '分析中...' : 'AI 分析这天'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function TradeLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);

  // CSV import state
  const [pendingLog, setPendingLog] = useState<TradeLog | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTradeLogs().then((data) => { setLogs(data); setLoading(false); });
  }, []);

  const handleFile = useCallback((text: string) => {
    const rows = parseCsv(text);
    if (!rows.length) { alert('CSV 解析失败，请检查文件格式'); return; }

    // Infer date from first trade's buy time
    const firstTime = rows[0].buyTime; // "01/12/2026 23:56:03"
    const parts = firstTime.split(' ')[0].split('/');
    const date = parts.length === 3
      ? `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
      : new Date().toISOString().split('T')[0];

    const { log, entries } = buildLogFromCsvRows(rows, date);
    setPendingLog({ ...log, entries });
  }, []);

  const handleConfirmImport = async () => {
    if (!pendingLog) return;
    setSaving(true);
    const entries = pendingLog.entries || [];
    const ok = await saveTradeLog(pendingLog, entries);
    setSaving(false);
    if (ok) {
      const updated = await fetchTradeLogs();
      setLogs(updated);
      setPendingLog(null);
    }
  };

  const handleDelete = useCallback((id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // Monthly grouping
  const monthGroups = logs.reduce<Record<string, TradeLog[]>>((acc, log) => {
    const month = log.date.slice(0, 7); // "2026-02"
    if (!acc[month]) acc[month] = [];
    acc[month].push(log);
    return acc;
  }, {});

  const months = Object.keys(monthGroups).sort().reverse();

  return (
    <div className="logs-page">
      <header className="page-header">
        <div className="page-header-left">
          <button className="page-back-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={18} />
            返回
          </button>
        </div>
        <span className="page-title">Trading Logs</span>
        <div className="header-actions" />
      </header>

      <div className="logs-content">
        <UploadZone onFile={handleFile} />

        {loading && <p className="logs-loading">加载中...</p>}

        {!loading && logs.length === 0 && (
          <div className="logs-empty">
            <p>暂无交易记录</p>
            <p className="logs-empty-sub">上传 performance.csv 开始记录</p>
          </div>
        )}

        {months.map((month) => {
          const monthLogs = monthGroups[month];
          const monthNet = monthLogs.reduce((s, l) => s + l.netPnl, 0);
          const monthTrades = monthLogs.reduce((s, l) => s + l.tradeCount, 0);
          const winDays = monthLogs.filter((l) => l.netPnl > 0).length;

          return (
            <div key={month} className="month-section">
              <div className="month-header">
                <div className="month-header-left">
                  <span className="month-label">
                    {new Date(month + '-01').toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                  </span>
                  <span className="month-days">{monthLogs.length} 天 · {monthTrades} 笔</span>
                </div>
                <div className="month-header-right">
                  <span className="month-win-rate">{winDays}胜/{monthLogs.length - winDays}负</span>
                  <span className={`month-pnl ${pnlClass(monthNet)}`}>{pnlStr(monthNet)}</span>
                </div>
              </div>

              <div className="month-log-list">
                {monthLogs.map((log) => (
                  <DayLogRow key={log.id} log={log} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {pendingLog && (
        <CsvPreviewModal
          log={pendingLog}
          onConfirm={handleConfirmImport}
          onCancel={() => setPendingLog(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
