import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Check, LogOut } from 'lucide-react';
import { FilterEditor } from '../components/system/FilterEditor';
import { SetupEditor } from '../components/system/SetupEditor';
import { MarkdownEditor } from '../components/system/MarkdownEditor';
import { useTradingSystem } from '../hooks/useTradingSystem';
import { useLogout } from '../hooks/useAuth';

const TABS = [
  { id: 'context', label: '市场过滤器' },
  { id: 'setups', label: 'Setups' },
  { id: 'equation', label: '交易者方程' },
  { id: 'risk', label: '仓位管理' },
  { id: 'psychology', label: '心理纪律' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SystemEditorPage() {
  const navigate = useNavigate();
  const logout = useLogout();
  const { system, updateSystem, save, saving, dirty } = useTradingSystem();
  const [activeTab, setActiveTab] = useState<TabId>('context');
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = async () => {
    await save();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="system-editor-page">
      <header className="page-header">
        <div className="page-header-left">
          <button className="page-back-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={18} />
            返回
          </button>
        </div>
        <span className="page-title">交易系统</span>
        <div className="header-actions">
          <button
            className="header-btn"
            onClick={handleSave}
            disabled={saving}
            style={dirty ? { color: 'var(--accent-blue)' } : {}}
          >
            {justSaved ? <Check size={16} /> : <Save size={16} />}
            <span>{justSaved ? '已保存' : saving ? '保存中...' : '保存'}</span>
          </button>
          <button className="header-btn" onClick={logout} title="登出">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="system-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`system-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="system-tab-content">
        {activeTab === 'context' && (
          <FilterEditor
            filters={system.contextFilters}
            onChange={(filters) =>
              updateSystem((prev) => ({ ...prev, contextFilters: filters }))
            }
          />
        )}

        {activeTab === 'setups' && (
          <SetupEditor
            config={system.treeConfig}
            onChange={(treeConfig) =>
              updateSystem((prev) => ({ ...prev, treeConfig }))
            }
          />
        )}

        {activeTab === 'equation' && (
          <MarkdownEditor
            value={system.tradersEquation}
            onChange={(v) =>
              updateSystem((prev) => ({ ...prev, tradersEquation: v }))
            }
          />
        )}

        {activeTab === 'risk' && (
          <MarkdownEditor
            value={system.riskManagement}
            onChange={(v) =>
              updateSystem((prev) => ({ ...prev, riskManagement: v }))
            }
          />
        )}

        {activeTab === 'psychology' && (
          <MarkdownEditor
            value={system.psychology}
            onChange={(v) =>
              updateSystem((prev) => ({ ...prev, psychology: v }))
            }
          />
        )}
      </div>
    </div>
  );
}
