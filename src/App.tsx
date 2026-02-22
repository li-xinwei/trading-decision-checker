import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CheckPage } from './pages/CheckPage';
import { SystemEditorPage } from './pages/SystemEditorPage';
import { useAuth } from './hooks/useAuth';
import './App.css';

function App() {
  const { authed, error, login } = useAuth();

  if (!authed) {
    return <LoginPage onLogin={login} error={error} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/check" element={<CheckPage />} />
        <Route path="/system" element={<SystemEditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
