import { useState, type FormEvent } from 'react';

interface LoginPageProps {
  onLogin: (password: string) => boolean;
  error: string;
}

export function LoginPage({ onLogin, error }: LoginPageProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src="/favicon.png" alt="Trading Portal" className="login-logo" />
        <h1>Trading Portal</h1>
        <p>输入密码以继续</p>
        <div className="login-input-group">
          <input
            type="password"
            className="login-input"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        <button type="submit" className="login-btn" disabled={!password}>
          登录
        </button>
        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}
