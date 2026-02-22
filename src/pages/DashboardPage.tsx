import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardCheck } from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">
      <div className="dashboard-greeting">
        <h1>Trading Portal</h1>
        <p>选择一个功能开始</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={() => navigate('/system')}>
          <div className="dashboard-card-icon system">
            <BookOpen size={24} />
          </div>
          <div>
            <h3>交易系统</h3>
            <p>查看与编辑你的交易系统规则、Setup 和决策树</p>
          </div>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/check')}>
          <div className="dashboard-card-icon check">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h3>开单检查</h3>
            <p>根据交易系统进行系统化的开单前检查</p>
          </div>
        </div>
      </div>
    </div>
  );
}
