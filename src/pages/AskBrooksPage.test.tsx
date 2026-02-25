import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('AskBrooksPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
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
    expect(screen.getByText('Session')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('navigates to session page when Session link clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Session'));
    expect(mockNavigate).toHaveBeenCalledWith('/session/new');
  });

  it('navigates to system page when System link clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('System'));
    expect(mockNavigate).toHaveBeenCalledWith('/system');
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

    // User message should appear
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

    // After submit, hero disappears and chat input appears
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ask a follow-up/i)).toBeInTheDocument();
    });
  });

  it('shows mock response after submission (no API configured)', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'What is a breakout?{enter}');

    // Wait for mock response (1.5s delay)
    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /Strong Breakout/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows typing indicator while loading', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'test{enter}');

    // Typing indicator should be visible during loading
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

    // Should show user message
    expect(
      screen.getByText('How to identify a strong breakout?')
    ).toBeInTheDocument();
  });

  // ---------- Chat view ----------

  it('shows sources in assistant response', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'What is a breakout?{enter}');

    await waitFor(
      () => {
        expect(
          screen.getByText('Trading Price Action Trends')
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows follow-up input in chat mode', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByPlaceholderText(/ask about price action/i);
    await user.type(input, 'test{enter}');

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/ask a follow-up/i)
      ).toBeInTheDocument();
    });
  });
});
