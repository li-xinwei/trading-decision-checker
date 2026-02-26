import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AskBrooksPage } from './pages/AskBrooksPage';
import { DashboardPage } from './pages/DashboardPage';
import { SystemEditorPage } from './pages/SystemEditorPage';
import { TradeLogsPage } from './pages/TradeLogsPage';
import { LogAnalyticsPage } from './pages/LogAnalyticsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AskBrooksPage />} />
        <Route path="/tools" element={<DashboardPage />} />
        <Route path="/system" element={<SystemEditorPage />} />
        <Route path="/logs" element={<TradeLogsPage />} />
        <Route path="/analytics" element={<LogAnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
