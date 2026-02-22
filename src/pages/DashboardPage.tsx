import { useNavigate } from 'react-router-dom';
import { BookOpen, PlayCircle, FileText, BarChart3, LogOut } from 'lucide-react';
import { useLogout } from '../hooks/useAuth';

export function DashboardPage() {
  const navigate = useNavigate();
  const logout = useLogout();

  const cards = [
    {
      icon: <PlayCircle size={18} />,
      iconClass: 'session',
      title: '新交易 Session',
      desc: '计时、开单检查、图表、进行中的交易',
      path: '/session/new',
    },
    {
      icon: <BookOpen size={18} />,
      iconClass: 'system',
      title: '交易系统',
      desc: '查看与编辑系统规则和 Setup',
      path: '/system',
    },
    {
      icon: <FileText size={18} />,
      iconClass: 'summary',
      title: '每日总结',
      desc: '交易心得记录，AI 格式化归档',
      path: '/summary',
    },
    {
      icon: <BarChart3 size={18} />,
      iconClass: 'analytics',
      title: '系统复盘',
      desc: '历史交易数据、胜率与统计',
      path: '/analytics',
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h1>Trading Portal</h1>
          <p>选择一个功能开始</p>
        </div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={16} />
          <span>登出</span>
        </button>
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
