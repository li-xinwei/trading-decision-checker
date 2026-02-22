import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type {
  DecisionTreeConfig,
  TreeNode,
  ResultNode,
} from '../../types/decisionTree';

interface SetupEditorProps {
  config: DecisionTreeConfig;
  onChange: (config: DecisionTreeConfig) => void;
}

interface SetupGroup {
  setupValue: string;
  setupLabel: string;
  icon?: string;
  nodes: TreeNode[];
  results: ResultNode[];
}

function collectNodesForSetup(
  config: DecisionTreeConfig,
  startNodeId: string
): { nodes: TreeNode[]; results: ResultNode[] } {
  const nodes: TreeNode[] = [];
  const results: ResultNode[] = [];
  const visited = new Set<string>();

  function walk(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const treeNode = config.nodes[nodeId];
    if (treeNode) {
      if (treeNode.category !== '交易方向') {
        nodes.push(treeNode);
      }
      for (const opt of treeNode.options) {
        if (opt.nextNodeId) walk(opt.nextNodeId);
      }
      return;
    }

    const resultNode = config.results[nodeId];
    if (resultNode) {
      results.push(resultNode);
    }
  }

  walk(startNodeId);
  return { nodes, results };
}

function groupSetups(config: DecisionTreeConfig): SetupGroup[] {
  const setupNode = config.nodes['choose_setup'];
  if (!setupNode) return [];

  return setupNode.options.map((opt) => {
    const { nodes, results } = collectNodesForSetup(
      config,
      opt.nextNodeId || ''
    );
    return {
      setupValue: opt.value,
      setupLabel: opt.label,
      icon: opt.icon,
      nodes,
      results,
    };
  });
}

function SetupCard({ group, config, onChange }: {
  group: SetupGroup;
  config: DecisionTreeConfig;
  onChange: (config: DecisionTreeConfig) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const backgroundNodes = group.nodes.filter(
    (n) => !n.question.includes('信号') && !n.question.includes('入场') && !n.question.includes('交易方向')
  );
  const entryNodes = group.nodes.filter(
    (n) => n.question.includes('信号') || n.question.includes('入场') || n.question.includes('K线')
  );
  const goResults = group.results.filter((r) => r.type === 'go');

  const updateNodeDescription = (nodeId: string, newDesc: string) => {
    const node = config.nodes[nodeId];
    if (!node) return;
    onChange({
      ...config,
      nodes: {
        ...config.nodes,
        [nodeId]: { ...node, description: newDesc },
      },
    });
  };

  const updateResultField = (
    resultId: string,
    field: 'entry' | 'stopLoss' | 'takeProfit' | 'notes',
    value: string
  ) => {
    const result = config.results[resultId];
    if (!result) return;
    onChange({
      ...config,
      results: {
        ...config.results,
        [resultId]: {
          ...result,
          executionPlan: {
            entry: result.executionPlan?.entry || '',
            stopLoss: result.executionPlan?.stopLoss || '',
            takeProfit: result.executionPlan?.takeProfit || '',
            ...result.executionPlan,
            [field]: value,
          },
        },
      },
    });
  };

  return (
    <div className="setup-card">
      <div
        className="setup-card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="setup-card-title">
          {group.icon && <span className="setup-icon">{group.icon}</span>}
          <span>{group.setupLabel}</span>
          <span className="setup-stat">{group.nodes.length} 步 · {goResults.length} 个GO结果</span>
        </div>
        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </div>

      {expanded && (
        <div className="setup-card-body animate-in">
          {backgroundNodes.length > 0 && (
            <div className="setup-section">
              <h4 className="setup-section-title">背景条件</h4>
              {backgroundNodes.map((node) => (
                <div key={node.id} className="setup-field">
                  <label>{node.question}</label>
                  <textarea
                    value={node.description || ''}
                    onChange={(e) =>
                      updateNodeDescription(node.id, e.target.value)
                    }
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}

          {entryNodes.length > 0 && (
            <div className="setup-section">
              <h4 className="setup-section-title">入场策略</h4>
              {entryNodes.map((node) => (
                <div key={node.id} className="setup-field">
                  <label>{node.question}</label>
                  <textarea
                    value={node.description || ''}
                    onChange={(e) =>
                      updateNodeDescription(node.id, e.target.value)
                    }
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}

          {goResults.length > 0 && (
            <div className="setup-section">
              <h4 className="setup-section-title">止盈止损方案</h4>
              {goResults.map((result) => (
                <div key={result.id} className="setup-execution-card">
                  <div className="setup-execution-title">{result.title.replace(/^.*?(?=[\u4e00-\u9fffA-Za-z])/, '')}</div>
                  <div className="setup-exec-fields">
                    <div className="setup-exec-field">
                      <label className="exec-label entry">入场</label>
                      <input
                        value={result.executionPlan?.entry || ''}
                        onChange={(e) =>
                          updateResultField(result.id, 'entry', e.target.value)
                        }
                      />
                    </div>
                    <div className="setup-exec-field">
                      <label className="exec-label sl">止损</label>
                      <input
                        value={result.executionPlan?.stopLoss || ''}
                        onChange={(e) =>
                          updateResultField(result.id, 'stopLoss', e.target.value)
                        }
                      />
                    </div>
                    <div className="setup-exec-field">
                      <label className="exec-label tp">止盈</label>
                      <input
                        value={result.executionPlan?.takeProfit || ''}
                        onChange={(e) =>
                          updateResultField(result.id, 'takeProfit', e.target.value)
                        }
                      />
                    </div>
                    <div className="setup-exec-field">
                      <label className="exec-label notes">备注</label>
                      <input
                        value={result.executionPlan?.notes || ''}
                        onChange={(e) =>
                          updateResultField(result.id, 'notes', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SetupEditor({ config, onChange }: SetupEditorProps) {
  const groups = useMemo(() => groupSetups(config), [config]);

  return (
    <div className="setup-editor">
      <div className="setup-editor-header">
        <h3>Setup 编辑器</h3>
        <p>点击展开每个 Setup 查看和编辑背景条件、入场策略、止盈止损</p>
      </div>
      <div className="setup-list">
        {groups.map((group) => (
          <SetupCard
            key={group.setupValue}
            group={group}
            config={config}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}
