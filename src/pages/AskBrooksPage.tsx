import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

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

const API_BASE = import.meta.env.VITE_ASK_BROOKS_API_URL as string || '';

export function AskBrooksPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(question?: string) {
    const q = question || input.trim();
    if (!q || loading) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      if (!API_BASE) {
        // Mock response when no API is configured
        await new Promise((r) => setTimeout(r, 1500));
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: getMockResponse(q),
            sources: ['Trading Price Action Trends', 'Trading Price Action Reversals', 'Trading Price Action Trading Ranges'],
          },
        ]);
      } else {
        const res = await fetch(`${API_BASE}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer || 'Sorry, I could not generate an answer.',
            sources: data.sources || [],
          },
        ]);
      }
    } catch (err) {
      console.error('Ask Brooks error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
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

  return (
    <div className="ab-page">
      {/* Nav */}
      <nav className="ab-nav">
        <div className="ab-nav-left">
          <span className="ab-nav-logo">📖</span>
          <span className="ab-nav-wordmark">Ask Brooks</span>
        </div>
        <div className="ab-nav-right">
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
              {messages.map((msg, i) => (
                <div key={i} className={`ab-msg ab-msg--${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="ab-msg-avatar">📖</div>
                  )}
                  <div className="ab-msg-content">
                    {msg.role === 'user' ? (
                      <p className="ab-msg-user-text">{msg.content}</p>
                    ) : (
                      <div className="ab-msg-answer">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="ab-sources">
                            <span className="ab-sources-label">Sources</span>
                            {msg.sources.map((s, j) => (
                              <span key={j} className="ab-source-tag">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

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
