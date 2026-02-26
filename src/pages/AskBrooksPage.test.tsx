import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AskBrooksPage } from './AskBrooksPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AskBrooksPage />
    </MemoryRouter>
  );
}

// For tests that need to control async timers (mock delay + typewriter),
// use fake timers with shouldAdvanceTime:true so React 18 scheduler & userEvent work.
// After userEvent interactions complete, vi.advanceTimersByTime fires the component's timers.
function setupWithFakeTimers() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  return userEvent.setup({ delay: null });  // delay:null means no between-key delays
}

// Advance the typewriter to completion.
// Typewriter: 3 chars per 8ms tick. Drive N steps at 8ms each.
async function driveTypewriter(steps: number) {
  for (let i = 0; i < steps; i++) {
    await act(async () => { vi.advanceTimersByTime(8); });
  }
}

describe('AskBrooksPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------- Hero / Landing ----------

  it('renders hero title and subtitle', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Ask Brooks' })).toBeInTheDocument();
    expect(
      screen.getByText(/instant answers about price action/i)
    ).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    renderPage();
    expect(
      screen.getByPlaceholderText(/ask about price action/i)
    ).toBeInTheDocument();
  });

  it('renders preset question pills', () => {
    renderPage();
    expect(
      screen.getByText('How to identify a strong breakout?')
    ).toBeInTheDocument();
    expect(screen.getByText('What is a measured move?')).toBeInTheDocument();
  });

  // ---------- Navigation ----------

  it('renders nav links', () => {
    renderPage();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders History nav link', () => {
    renderPage();
    expect(screen.getByText(/History/i)).toBeInTheDocument();
  });

  it('navigates to tools page when Tools link clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Tools'));
    expect(mockNavigate).toHaveBeenCalledWith('/tools');
  });

  it('navigates to logs page when Logs link clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Logs'));
    expect(mockNavigate).toHaveBeenCalledWith('/logs');
  });

  it('navigates to analytics page when Analytics link clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Analytics'));
    expect(mockNavigate).toHaveBeenCalledWith('/analytics');
  });

  // ---------- Search / Submit ----------

  it('send button is disabled when input is empty', () => {
    renderPage();
    const sendBtn = screen.getByText('→');
    expect(sendBtn).toBeDisabled();
  });

  it('submits a question and shows user message', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'What is a trend bar?');
    await user.click(screen.getByText('→'));

    expect(screen.getByText('What is a trend bar?')).toBeInTheDocument();
  });

  it('submits a question via Enter key', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'What is a signal bar?{enter}');

    expect(screen.getByText('What is a signal bar?')).toBeInTheDocument();
  });

  it('switches to chat view after submission', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'test question{enter}');

    // User message is added synchronously; chat view appears immediately
    expect(screen.getByPlaceholderText(/ask a follow-up/i)).toBeInTheDocument();
  });

  it('shows mock response after submission (no API configured)', async () => {
    const user = setupWithFakeTimers();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'What is a breakout?{enter}');

    // Advance past 1.5s mock delay
    await act(async () => { vi.advanceTimersByTime(2000); });

    // Drive the typewriter to completion:
    // Response is ~570 chars, 3 chars/8ms → ~190 steps. Use 250 for safety.
    await driveTypewriter(250);

    // After typing completes, ReactMarkdown renders the heading
    expect(screen.getByRole('heading', { name: /Strong Breakout/i })).toBeInTheDocument();
  });

  it('shows typing indicator while loading', async () => {
    const user = setupWithFakeTimers();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'test{enter}');

    // Typing indicator visible immediately (mock 1.5s delay not elapsed yet)
    const dots = document.querySelectorAll('.ab-typing span');
    expect(dots.length).toBe(3);
  });

  // ---------- Preset pills ----------

  it('submits question when preset pill is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByText('How to identify a strong breakout?')
    );

    expect(
      screen.getByText('How to identify a strong breakout?')
    ).toBeInTheDocument();
  });

  // ---------- Chat view ----------

  it('shows sources in assistant response', async () => {
    const user = setupWithFakeTimers();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'What is a breakout?{enter}');

    // Advance past 1.5s mock delay
    await act(async () => { vi.advanceTimersByTime(2000); });

    // Drive the typewriter to full completion (~250 steps at 8ms, 3 chars/step)
    await driveTypewriter(250);

    expect(screen.getByText('Trading Price Action Trends')).toBeInTheDocument();
  });

  it('shows follow-up input in chat mode', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'test{enter}');

    // User message added synchronously → chat view with follow-up input appears
    expect(screen.getByPlaceholderText(/ask a follow-up/i)).toBeInTheDocument();
  });

  // ---------- History ----------

  it('opens history panel when History button clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText(/History/i));

    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('closes history panel when overlay clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText(/History/i));
    // Click the overlay (not the panel) — the overlay is the parent element
    const overlay = document.querySelector('.ab-history-overlay');
    if (overlay) await user.click(overlay);

    expect(screen.queryByText('No conversations yet')).not.toBeInTheDocument();
  });

  it('saves session to history after first question', async () => {
    const user = setupWithFakeTimers();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'What is a trend bar?{enter}');

    // The session is created immediately when the first user message is added
    // Open history panel to verify — session entry appears in the panel
    await user.click(screen.getByText(/History/i));
    const panel = document.querySelector('.ab-history-list');
    expect(panel).not.toBeNull();
    expect(panel!.textContent).toContain('What is a trend bar?');
  });
});
