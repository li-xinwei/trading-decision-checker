import { useState } from 'react';
import { Plus, Trash2, Edit3, X, Check } from 'lucide-react';
import type { ContextFilter } from '../../types/decisionTree';

interface FilterEditorProps {
  filters: ContextFilter[];
  onChange: (filters: ContextFilter[]) => void;
}

export function FilterEditor({ filters, onChange }: FilterEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContextFilter | null>(null);

  const startEdit = (filter: ContextFilter) => {
    setEditingId(filter.id);
    setDraft({ ...filter, conditions: [...filter.conditions] });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    const updated = filters.map((f) => (f.id === draft.id ? draft : f));
    onChange(updated);
    cancelEdit();
  };

  const addFilter = () => {
    const newFilter: ContextFilter = {
      id: `filter_${Date.now()}`,
      name: '新过滤器',
      description: '描述过滤器的触发条件',
      conditions: ['条件1'],
      action: 'block',
      blockMessage: '该市场环境不适合交易',
    };
    onChange([...filters, newFilter]);
    startEdit(newFilter);
  };

  const deleteFilter = (id: string) => {
    onChange(filters.filter((f) => f.id !== id));
    if (editingId === id) cancelEdit();
  };

  return (
    <div className="filter-list">
      {filters.map((filter) =>
        editingId === filter.id && draft ? (
          <FilterEditForm
            key={filter.id}
            draft={draft}
            onDraftChange={setDraft}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        ) : (
          <div key={filter.id} className="filter-card">
            <div className="filter-card-header">
              <h4>
                {filter.name}
                <span className={`filter-badge ${filter.action}`}>
                  {filter.action === 'block' ? '一票否决' : '警告'}
                </span>
              </h4>
              <div className="filter-card-actions">
                <button className="filter-action-btn" onClick={() => startEdit(filter)}>
                  <Edit3 size={13} /> 编辑
                </button>
                <button className="filter-action-btn danger" onClick={() => deleteFilter(filter.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <p className="filter-desc">{filter.description}</p>
            <div className="filter-conditions">
              {filter.conditions.map((c, i) => (
                <div key={i} className="filter-condition">{c}</div>
              ))}
            </div>
          </div>
        )
      )}
      <button className="add-btn" onClick={addFilter}>
        <Plus size={16} /> 添加过滤器
      </button>
    </div>
  );
}

interface FilterEditFormProps {
  draft: ContextFilter;
  onDraftChange: (draft: ContextFilter) => void;
  onSave: () => void;
  onCancel: () => void;
}

function FilterEditForm({ draft, onDraftChange, onSave, onCancel }: FilterEditFormProps) {
  const update = (partial: Partial<ContextFilter>) => {
    onDraftChange({ ...draft, ...partial });
  };

  const updateCondition = (index: number, value: string) => {
    const conditions = [...draft.conditions];
    conditions[index] = value;
    update({ conditions });
  };

  const addCondition = () => {
    update({ conditions: [...draft.conditions, ''] });
  };

  const removeCondition = (index: number) => {
    update({ conditions: draft.conditions.filter((_, i) => i !== index) });
  };

  return (
    <div className="filter-card" style={{ border: '1px solid var(--accent-blue)' }}>
      <div className="filter-card-header">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: 16,
            fontWeight: 600,
            outline: 'none',
            width: '100%',
          }}
        />
        <div className="filter-card-actions">
          <button className="filter-action-btn" onClick={onSave} style={{ color: 'var(--go-color)' }}>
            <Check size={13} /> 保存
          </button>
          <button className="filter-action-btn" onClick={onCancel}>
            <X size={13} /> 取消
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <textarea
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={2}
          placeholder="描述"
          className="markdown-textarea"
          style={{ minHeight: 60, fontFamily: 'inherit' }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <input
              type="radio"
              checked={draft.action === 'block'}
              onChange={() => update({ action: 'block' })}
            />
            一票否决
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <input
              type="radio"
              checked={draft.action === 'warn'}
              onChange={() => update({ action: 'warn' })}
            />
            警告
          </label>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            触发条件
          </div>
          {draft.conditions.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input
                type="text"
                value={c}
                onChange={(e) => updateCondition(i, e.target.value)}
                className="login-input"
                style={{ padding: '8px 12px', fontSize: 13 }}
              />
              <button
                className="filter-action-btn danger"
                onClick={() => removeCondition(i)}
                style={{ flexShrink: 0 }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
          <button
            className="filter-action-btn"
            onClick={addCondition}
            style={{ marginTop: 4 }}
          >
            <Plus size={13} /> 添加条件
          </button>
        </div>

        <textarea
          value={draft.blockMessage}
          onChange={(e) => update({ blockMessage: e.target.value })}
          rows={2}
          placeholder="触发后的提示消息"
          className="markdown-textarea"
          style={{ minHeight: 60, fontFamily: 'inherit' }}
        />
      </div>
    </div>
  );
}
