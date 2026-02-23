import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { CheckPage } from './pages/CheckPage';
import { SystemEditorPage } from './pages/SystemEditorPage';
import { SessionPage } from './pages/SessionPage';
import { DailySummaryPage } from './pages/DailySummaryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import './App.css';

function App() {
  return (
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
  );
}

export default App;
