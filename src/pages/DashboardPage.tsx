import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, BarChart3 } from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();

  const cards = [
    {
      icon: <ClipboardList size={18} />,
      iconClass: 'logs',
      title: 'Trading Logs',
      desc: '上传 CSV，记录进出场理由与复盘',
      path: '/logs',
    },
    {
      icon: <BarChart3 size={18} />,
      iconClass: 'analytics',
      title: '统计分析',
      desc: '盈亏曲线、胜率、AI 整体分析',
      path: '/analytics',
    },
    {
      icon: <BookOpen size={18} />,
      iconClass: 'system',
      title: '交易系统',
      desc: '查看与编辑系统规则和 Setup',
      path: '/system',
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h1>Trading Portal</h1>
          <p>选择一个功能开始</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards.map((c) => (
          <div key={c.path} className="dashboard-card" onClick={() => navigate(c.path)}>
            <div className={`dashboard-card-icon ${c.iconClass}`}>{c.icon}</div>
            <div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
