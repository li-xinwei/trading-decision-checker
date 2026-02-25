import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

const PRESET_QUESTIONS = [
  { icon: '📊', text: 'How to identify a strong breakout?' },
  { icon: '🔄', text: 'What is a measured move?' },
  { icon: '📈', text: 'When to enter a pullback in a trend?' },
  { icon: '🛡️', text: 'How to set stop loss using price action?' },
  { icon: '⚖️', text: "What is Al Brooks' trading equation?" },
  { icon: '🕯️', text: 'How to read a doji bar in context?' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface Session {
  id: string;
  startedAt: number;
  firstQuestion: string;
  messages: Message[];
  conversationId: string | null;
}

const API_BASE = import.meta.env.VITE_ASK_BROOKS_API_URL as string || '';
const LS_KEY = 'ask-brooks-v1';
const LS_SESSIONS_KEY = 'ask-brooks-sessions-v1';

function loadCurrentState(): { messages: Message[]; conversationId: string | null } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { messages: [], conversationId: null };
    return JSON.parse(raw);
  } catch {
    return { messages: [], conversationId: null };
  }
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(LS_SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  // Keep at most 50 sessions
  const trimmed = sessions.slice(-50);
  localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(trimmed));
}

// ---- Citation helpers ----

/** Splits "...Brooks [1][2]..." into ["...Brooks ", 1, 2, "..."] */
function parseCitations(text: string): Array<string | number> {
  const parts: Array<string | number> = [];
  let last = 0;
  const re = /\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(parseInt(m[1], 10));
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

function CitationBadge({
  num,
  sources,
  onTooltip,
}: {
  num: number;
  sources: string[];
  onTooltip: (state: TooltipState | null) => void;
}) {
  const label = sources[num - 1] ?? `Source ${num}`;
  return (
    <span
      className="ab-citation"
      onMouseEnter={(e) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        onTooltip({
          text: label,
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
        });
      }}
      onMouseLeave={() => onTooltip(null)}
    >
      {num}
    </span>
  );
}

function makeMarkdownComponents(
  sources: string[],
  onTooltip: (state: TooltipState | null) => void
): Components {
  function renderWithCitations(children: React.ReactNode): React.ReactNode {
    return (Array.isArray(children) ? children : [children]).map((child, i) => {
      if (typeof child === 'string') {
        const tokens = parseCitations(child);
        if (tokens.length === 1 && typeof tokens[0] === 'string') return child;
        return tokens.map((token, j) =>
          typeof token === 'number' ? (
            <CitationBadge key={`${i}-${j}`} num={token} sources={sources} onTooltip={onTooltip} />
          ) : (
            <span key={`${i}-${j}`}>{token}</span>
          )
        );
      }
      return child;
    });
  }

  return {
    p: ({ children, node: _node, ...props }) => (
      <p {...props}>{renderWithCitations(children)}</p>
    ),
    li: ({ children, node: _node, ...props }) => (
      <li {...props}>{renderWithCitations(children)}</li>
    ),
  };
}

export function AskBrooksPage() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>(() => loadCurrentState().messages);
  const [conversationId, setConversationId] = useState<string | null>(() => loadCurrentState().conversationId);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Typewriter state
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [displayedText, setDisplayedText] = useState('');

  // History panel
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());

  // Citation tooltip (React-managed, position: fixed)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Current session id (set when the first message is sent)
  const currentSessionIdRef = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasConversation = messages.length > 0;

  // Scroll on new messages or typewriter progress
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, displayedText]);

  // Typewriter loop: advance 3 characters every 8ms (smooth & fast)
  useEffect(() => {
    if (typingIndex === null) return;
    const fullText = messages[typingIndex]?.content ?? '';
    if (displayedText.length >= fullText.length) {
      setTypingIndex(null);
      return;
    }
    const id = setTimeout(() => {
      setDisplayedText(fullText.slice(0, displayedText.length + 3));
    }, 8);
    return () => clearTimeout(id);
  }, [typingIndex, displayedText, messages]);

  // Persist current conversation to localStorage after typing completes
  useEffect(() => {
    if (typingIndex !== null) return;
    localStorage.setItem(LS_KEY, JSON.stringify({ messages, conversationId }));

    // Also update the session record for this conversation
    if (messages.length > 0 && currentSessionIdRef.current) {
      const sid = currentSessionIdRef.current;
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === sid);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], messages, conversationId };
          saveSessions(updated);
          return updated;
        }
        return prev;
      });
    }
  }, [messages, conversationId, typingIndex]);

  function startTypewriter(msgIndex: number) {
    setTypingIndex(msgIndex);
    setDisplayedText('');
  }

  const handleTooltip = useCallback((state: TooltipState | null) => {
    setTooltip(state);
  }, []);

  async function handleSubmit(question?: string) {
    const q = question || input.trim();
    if (!q || loading) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: q };

    // Initialize session on first message
    setMessages((prev) => {
      const next = [...prev, userMsg];
      if (prev.length === 0) {
        // Brand-new conversation — create a session record
        const sid = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        currentSessionIdRef.current = sid;
        const newSession: Session = {
          id: sid,
          startedAt: Date.now(),
          firstQuestion: q,
          messages: next,
          conversationId: null,
        };
        setSessions((prevSessions) => {
          const updated = [...prevSessions, newSession];
          saveSessions(updated);
          return updated;
        });
      }
      return next;
    });
    setLoading(true);

    try {
      if (!API_BASE) {
        await new Promise((r) => setTimeout(r, 1500));
        const assistantMsg: Message = {
          role: 'assistant',
          content: getMockResponse(q),
          sources: ['Trading Price Action Trends', 'Trading Price Action Reversals', 'Trading Price Action Trading Ranges'],
        };
        setMessages((prev) => {
          const next = [...prev, assistantMsg];
          startTypewriter(next.length - 1);
          return next;
        });
      } else {
        const res = await fetch(`${API_BASE}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, conversation_id: conversationId }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();

        if (data.conversation_id) setConversationId(data.conversation_id);

        const assistantMsg: Message = {
          role: 'assistant',
          content: data.answer || 'Sorry, I could not generate an answer.',
          sources: data.sources || [],
        };
        setMessages((prev) => {
          const next = [...prev, assistantMsg];
          startTypewriter(next.length - 1);
          return next;
        });
      }
    } catch (err) {
      console.error('Ask Brooks error:', err);
      setConversationId(null);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleNewChat() {
    setMessages([]);
    setConversationId(null);
    setTypingIndex(null);
    setDisplayedText('');
    currentSessionIdRef.current = null;
    localStorage.removeItem(LS_KEY);
  }

  function handleLoadSession(session: Session) {
    setMessages(session.messages);
    setConversationId(session.conversationId);
    setTypingIndex(null);
    setDisplayedText('');
    currentSessionIdRef.current = session.id;
    localStorage.setItem(LS_KEY, JSON.stringify({ messages: session.messages, conversationId: session.conversationId }));
    setShowHistory(false);
  }

  function handleClearHistory() {
    setSessions([]);
    localStorage.removeItem(LS_SESSIONS_KEY);
  }

  function formatRelativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  return (
    <div className="ab-page">
      {/* Citation tooltip (React-managed, position:fixed so it escapes all containers) */}
      {tooltip && (
        <div
          className="ab-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* History panel overlay */}
      {showHistory && (
        <div className="ab-history-overlay" onClick={() => setShowHistory(false)}>
          <div className="ab-history-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ab-history-header">
              <h2>History</h2>
              <div className="ab-history-header-actions">
                {sessions.length > 0 && (
                  <button className="ab-history-clear-btn" onClick={handleClearHistory}>
                    Clear all
                  </button>
                )}
                <button className="ab-history-close-btn" onClick={() => setShowHistory(false)}>
                  ✕
                </button>
              </div>
            </div>
            {sessions.length === 0 ? (
              <div className="ab-history-empty">
                <div className="ab-history-empty-icon" style={{ fontSize: 36 }}>📖</div>
                <p>No conversations yet</p>
                <p className="ab-history-empty-sub">Your past sessions will appear here</p>
              </div>
            ) : (
              <div className="ab-history-list">
                {[...sessions].reverse().map((session) => (
                  <button
                    key={session.id}
                    className="ab-history-item"
                    onClick={() => handleLoadSession(session)}
                  >
                    <div className="ab-history-item-question">{session.firstQuestion}</div>
                    <div className="ab-history-item-meta">
                      <span>{session.messages.length} messages</span>
                      <span>·</span>
                      <span>{formatRelativeTime(session.startedAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="ab-nav">
        <div className="ab-nav-left">
          <span className="ab-nav-logo">📖</span>
          <span className="ab-nav-wordmark">Ask Brooks</span>
        </div>
        <div className="ab-nav-right">
          <button className="ab-nav-link" onClick={() => setShowHistory(true)}>
            History {sessions.length > 0 && <span className="ab-history-count">{sessions.length}</span>}
          </button>
          {hasConversation && (
            <button className="ab-nav-link ab-nav-link--new" onClick={handleNewChat}>New chat</button>
          )}
          <button className="ab-nav-link" onClick={() => navigate('/session/new')}>Session</button>
          <button className="ab-nav-link" onClick={() => navigate('/system')}>System</button>
          <button className="ab-nav-link" onClick={() => navigate('/summary')}>Summary</button>
          <button className="ab-nav-link" onClick={() => navigate('/analytics')}>Analytics</button>
        </div>
      </nav>

      {/* Main content */}
      <main className={`ab-main ${hasConversation ? 'ab-main--chat' : ''}`}>
        {!hasConversation ? (
          /* Landing / Hero */
          <div className="ab-hero">
            <div className="ab-hero-icon">📖</div>
            <h1 className="ab-hero-title">Ask Brooks</h1>
            <p className="ab-hero-sub">
              Get instant answers about price action trading from Al Brooks' three books.
            </p>

            {/* Search */}
            <div className="ab-search-wrap">
              <div className="ab-search-box">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about price action trading..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="ab-search-send"
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || loading}
                >
                  →
                </button>
              </div>
            </div>

            {/* Preset pills */}
            <div className="ab-pills">
              {PRESET_QUESTIONS.map((pq) => (
                <button
                  key={pq.text}
                  className="ab-pill"
                  onClick={() => handleSubmit(pq.text)}
                >
                  <span className="ab-pill-icon">{pq.icon}</span>
                  {pq.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat view */
          <div className="ab-chat">
            <div className="ab-messages">
              {messages.map((msg, i) => {
                const isTyping = typingIndex === i;
                const content = isTyping ? displayedText : msg.content;
                const sources = msg.sources ?? [];

                return (
                  <div key={i} className={`ab-msg ab-msg--${msg.role}`}>
                    {msg.role === 'assistant' && (
                      <div className="ab-msg-avatar">📖</div>
                    )}
                    <div className="ab-msg-content">
                      {msg.role === 'user' ? (
                        <p className="ab-msg-user-text">{msg.content}</p>
                      ) : (
                        <div className="ab-msg-answer">
                          {isTyping ? (
                            /* During typing: render plain text to avoid partial-markdown artifacts */
                            <div className="ab-msg-streaming">{content}</div>
                          ) : (
                            /* Typing complete: render full markdown with citations */
                            <ReactMarkdown
                              components={makeMarkdownComponents(sources, handleTooltip)}
                            >
                              {content}
                            </ReactMarkdown>
                          )}
                          {!isTyping && sources.length > 0 && (
                            <div className="ab-sources">
                              <span className="ab-sources-label">Sources</span>
                              {sources.map((s, j) => (
                                <span key={j} className="ab-source-tag">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="ab-msg ab-msg--assistant">
                  <div className="ab-msg-avatar">📖</div>
                  <div className="ab-msg-content">
                    <div className="ab-typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input (bottom) */}
            <div className="ab-chat-input-wrap">
              <div className="ab-search-box">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask a follow-up..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="ab-search-send"
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || loading}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

function getMockResponse(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes('breakout')) {
    return `## Identifying a Strong Breakout

A strong breakout has several key characteristics according to Al Brooks:

1. **Large trend bars** closing near their extremes in the direction of the breakout
2. **Minimal overlap** between consecutive bars
3. **Increasing volume** (though Brooks considers this less important than bar behavior)
4. **Follow-through** — the next several bars continue in the breakout direction

The most important sign is a sequence of **consecutive trend bars** with bodies larger than average. A breakout that has pullbacks within the first few bars is weaker.

> "A strong breakout has bars with relatively large bodies, small tails, and little overlap between bars." — Al Brooks`;
  }
  if (lower.includes('measured move')) {
    return `## Measured Move

A measured move (also called a "leg 1 = leg 2" pattern) is when the market makes two moves of approximately equal size in the same direction, separated by a pullback.

**How to measure:**
- Measure the distance of the first leg (from start to end)
- Project that same distance from the end of the pullback

**Key points:**
- Works in both trends and trading ranges
- The pullback between the two legs is often about 50% of the first leg
- Common in channels and broad channels

> "The market has inertia and tends to create legs that are about the same size." — Al Brooks`;
  }
  return `## Price Action Analysis

Based on Al Brooks' teachings, here are the key principles related to your question:

1. **Always trade with the trend** — The probability of continuation is higher than reversal
2. **Wait for a second signal** — If you miss the first entry, wait for a pullback and a second entry signal
3. **Manage risk carefully** — Use the size of the signal bar as your initial stop distance

The most important concept is the **trading equation**: Probability × Reward must be greater than (1 - Probability) × Risk for a trade to be worth taking.

If you have a more specific question, I can provide more targeted analysis from Al Brooks' three price action books.`;
}
