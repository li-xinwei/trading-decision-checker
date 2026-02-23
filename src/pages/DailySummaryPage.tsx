import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, Save, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatDailySummary } from '../lib/openai';
import {
  fetchAllTrades,
  saveDailySummary,
  fetchDailySummaries,
} from '../lib/supabase';
import type { DailySummary } from '../types/trading';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function DailySummaryPage() {
  const navigate = useNavigate();

  const [date, setDate] = useState(todayStr());
  const [rawNotes, setRawNotes] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [formatting, setFormatting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [history, setHistory] = useState<DailySummary[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<DailySummary | null>(null);

  useEffect(() => {
    fetchDailySummaries().then(setHistory);
  }, []);

  const handleFormat = async () => {
    if (!rawNotes.trim()) return;
    setFormatting(true);
    try {
      const trades = await fetchAllTrades();
      const todayTrades = trades.filter((t) => {
        const d = new Date(t.openedAt).toISOString().split('T')[0];
        return d === date;
      });
      const result = await formatDailySummary(rawNotes, todayTrades);
      setAiSummary(result);
    } finally {
      setFormatting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const summary: DailySummary = {
      id: `summary_${date}`,
      date,
      rawNotes,
      aiSummary: aiSummary || undefined,
      sessionIds: [],
      createdAt: Date.now(),
    };
    await saveDailySummary(summary);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    setSaving(false);
    const updated = await fetchDailySummaries();
    setHistory(updated);
  };

  const loadHistoryItem = (item: DailySummary) => {
    setSelectedHistory(item);
    setDate(item.date);
    setRawNotes(item.rawNotes);
    setAiSummary(item.aiSummary || '');
  };

  return (
    <div className="summary-page">
      <header className="page-header">
        <div className="page-header-left">
          <button className="page-back-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={18} />
            返回
          </button>
        </div>
        <span className="page-title">每日总结</span>
        <div className="header-actions">
        </div>
      </header>

      <div className="summary-content">
        <div className="summary-main">
          <div className="summary-top-bar">
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedHistory(null);
              }}
              className="summary-date-input"
            />
            <div className="summary-actions">
              <button
                className="summary-ai-btn"
                onClick={handleFormat}
                disabled={formatting || !rawNotes.trim()}
              >
                <Sparkles size={14} />
                {formatting ? 'AI 整理中...' : 'AI 格式化'}
              </button>
              <button
                className="summary-save-btn"
                onClick={handleSave}
                disabled={saving || !rawNotes.trim()}
              >
                {justSaved ? <Check size={14} /> : <Save size={14} />}
                {justSaved ? '已保存' : '保存'}
              </button>
            </div>
          </div>

          <div className="summary-editor-area">
            <div className="summary-input-pane">
              <div className="pane-label">交易心得</div>
              <textarea
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                placeholder="记录今天的交易心得、做得好的地方、需要改进的地方..."
                className="summary-textarea"
              />
            </div>

            <div className="summary-preview-pane">
              <div className="pane-label">AI 整理预览</div>
              <div className="summary-preview">
                {aiSummary ? (
                  <ReactMarkdown>{aiSummary}</ReactMarkdown>
                ) : (
                  <p className="preview-placeholder">
                    输入心得后点击 "AI 格式化" 生成结构化总结
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="summary-history">
          <h4>历史总结</h4>
          {history.length === 0 && (
            <p className="summary-empty">暂无历史总结</p>
          )}
          {history.map((item) => (
            <div
              key={item.id}
              className={`summary-history-item ${selectedHistory?.id === item.id ? 'active' : ''}`}
              onClick={() => loadHistoryItem(item)}
            >
              <span className="summary-history-date">{item.date}</span>
              <span className="summary-history-preview">
                {item.rawNotes.slice(0, 60)}
                {item.rawNotes.length > 60 ? '...' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
