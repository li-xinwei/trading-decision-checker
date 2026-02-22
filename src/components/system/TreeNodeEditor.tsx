import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { TreeNode, ResultNode, TreeOption } from '../../types/decisionTree';

interface TreeNodeEditorProps {
  node: TreeNode | ResultNode;
  onSave: (node: TreeNode | ResultNode) => void;
  onClose: () => void;
}

export function TreeNodeEditor({ node, onSave, onClose }: TreeNodeEditorProps) {
  const isTreeNode = 'options' in node;
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(node)));

  const handleSave = () => {
    onSave(draft);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1c1c1e', borderRadius: 18, padding: 28,
          width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {isTreeNode ? '编辑问题节点' : '编辑结果节点'}
          </h3>
          <button onClick={onClose} style={{ background: 'rgba(118,118,128,0.12)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {isTreeNode ? (
          <TreeNodeForm draft={draft as TreeNode} onChange={(d) => setDraft(d)} />
        ) : (
          <ResultNodeForm draft={draft as ResultNode} onChange={(d) => setDraft(d)} />
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose} className="filter-action-btn">取消</button>
          <button onClick={handleSave} className="login-btn" style={{ width: 'auto', padding: '10px 24px', fontSize: 14 }}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function TreeNodeForm({ draft, onChange }: { draft: TreeNode; onChange: (d: TreeNode) => void }) {
  const update = (partial: Partial<TreeNode>) => onChange({ ...draft, ...partial });

  const updateOption = (index: number, partial: Partial<TreeOption>) => {
    const options = [...draft.options];
    options[index] = { ...options[index], ...partial };
    update({ options });
  };

  const addOption = () => {
    update({
      options: [...draft.options, { label: '新选项', value: `opt_${Date.now()}`, nextNodeId: null }],
    });
  };

  const removeOption = (index: number) => {
    update({ options: draft.options.filter((_, i) => i !== index) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="分类">
        <input
          className="login-input"
          value={draft.category}
          onChange={(e) => update({ category: e.target.value })}
          style={{ padding: '10px 14px', fontSize: 14 }}
        />
      </Field>
      <Field label="问题">
        <input
          className="login-input"
          value={draft.question}
          onChange={(e) => update({ question: e.target.value })}
          style={{ padding: '10px 14px', fontSize: 14 }}
        />
      </Field>
      <Field label="描述">
        <textarea
          className="markdown-textarea"
          value={draft.description || ''}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          style={{ minHeight: 70, fontFamily: 'inherit' }}
        />
      </Field>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          选项
        </div>
        {draft.options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              className="login-input"
              value={opt.label}
              onChange={(e) => updateOption(i, { label: e.target.value })}
              placeholder="选项文本"
              style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
            />
            <button className="filter-action-btn danger" onClick={() => removeOption(i)} style={{ flexShrink: 0 }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button className="filter-action-btn" onClick={addOption} style={{ marginTop: 4 }}>
          <Plus size={13} /> 添加选项
        </button>
      </div>
    </div>
  );
}

function ResultNodeForm({ draft, onChange }: { draft: ResultNode; onChange: (d: ResultNode) => void }) {
  const update = (partial: Partial<ResultNode>) => onChange({ ...draft, ...partial });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="结果类型">
        <div style={{ display: 'flex', gap: 12 }}>
          {(['go', 'caution', 'no-go'] as const).map((t) => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="radio" checked={draft.type === t} onChange={() => update({ type: t })} />
              {t === 'go' ? 'GO' : t === 'caution' ? 'CAUTION' : 'NO-GO'}
            </label>
          ))}
        </div>
      </Field>
      <Field label="标题">
        <input
          className="login-input"
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          style={{ padding: '10px 14px', fontSize: 14 }}
        />
      </Field>
      <Field label="消息">
        <textarea
          className="markdown-textarea"
          value={draft.message}
          onChange={(e) => update({ message: e.target.value })}
          rows={3}
          style={{ minHeight: 70, fontFamily: 'inherit' }}
        />
      </Field>
      {draft.executionPlan && (
        <>
          <Field label="入场方式">
            <input
              className="login-input"
              value={draft.executionPlan.entry}
              onChange={(e) => update({ executionPlan: { ...draft.executionPlan!, entry: e.target.value } })}
              style={{ padding: '10px 14px', fontSize: 14 }}
            />
          </Field>
          <Field label="止损位">
            <input
              className="login-input"
              value={draft.executionPlan.stopLoss}
              onChange={(e) => update({ executionPlan: { ...draft.executionPlan!, stopLoss: e.target.value } })}
              style={{ padding: '10px 14px', fontSize: 14 }}
            />
          </Field>
          <Field label="止盈目标">
            <input
              className="login-input"
              value={draft.executionPlan.takeProfit}
              onChange={(e) => update({ executionPlan: { ...draft.executionPlan!, takeProfit: e.target.value } })}
              style={{ padding: '10px 14px', fontSize: 14 }}
            />
          </Field>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {children}
    </div>
  );
}
