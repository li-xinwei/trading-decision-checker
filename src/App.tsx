import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CheckPage } from './pages/CheckPage';
import { SystemEditorPage } from './pages/SystemEditorPage';
import { SessionPage } from './pages/SessionPage';
import { DailySummaryPage } from './pages/DailySummaryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { useAuth, AuthContext } from './hooks/useAuth';
import './App.css';

function App() {
  const { authed, error, login, logout } = useAuth();

  if (!authed) {
    return <LoginPage onLogin={login} error={error} />;
  }

  return (
    <AuthContext.Provider value={{ logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/check" element={<CheckPage />} />
          <Route path="/system" element={<SystemEditorPage />} />
          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/summary" element={<DailySummaryPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
