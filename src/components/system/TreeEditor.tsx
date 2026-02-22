import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeChange,
  applyNodeChanges,
  type NodeTypes,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { DecisionTreeConfig, TreeNode as TreeNodeType, ResultNode } from '../../types/decisionTree';
import { TreeNodeCard } from './TreeNodeCard';
import { TreeResultCard } from './TreeResultCard';
import { TreeNodeEditor } from './TreeNodeEditor';

interface TreeEditorProps {
  config: DecisionTreeConfig;
  onChange: (config: DecisionTreeConfig) => void;
}

const nodeTypes: NodeTypes = {
  treeNode: TreeNodeCard,
  resultNode: TreeResultCard,
};

function layoutTree(config: DecisionTreeConfig): Node[] {
  const nodes: Node[] = [];
  const visited = new Set<string>();
  const positions = new Map<string, { x: number; y: number }>();

  function traverse(nodeId: string, x: number, y: number, depth: number) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    positions.set(nodeId, { x, y });

    const node = config.nodes[nodeId];
    if (!node) {
      const result = config.results[nodeId];
      if (result) {
        positions.set(nodeId, { x, y });
      }
      return;
    }

    const childIds = node.options
      .map((o) => o.nextNodeId)
      .filter((id): id is string => id !== null);

    const totalWidth = childIds.length * 280;
    const startX = x - totalWidth / 2 + 140;

    childIds.forEach((childId, i) => {
      traverse(childId, startX + i * 280, y + 200, depth + 1);
    });
  }

  traverse(config.rootNodeId, 600, 50, 0);

  for (const [id, pos] of positions) {
    const treeNode = config.nodes[id];
    const resultNode = config.results[id];

    if (treeNode) {
      nodes.push({
        id,
        type: 'treeNode',
        position: pos,
        data: { node: treeNode },
      });
    } else if (resultNode) {
      nodes.push({
        id,
        type: 'resultNode',
        position: pos,
        data: { node: resultNode },
      });
    }
  }

  return nodes;
}

function buildEdges(config: DecisionTreeConfig): Edge[] {
  const edges: Edge[] = [];
  for (const node of Object.values(config.nodes)) {
    for (const option of node.options) {
      if (option.nextNodeId) {
        edges.push({
          id: `${node.id}-${option.nextNodeId}-${option.value}`,
          source: node.id,
          target: option.nextNodeId,
          label: option.label.length > 20 ? option.label.slice(0, 18) + '…' : option.label,
          style: { stroke: 'rgba(168, 168, 176, 0.3)', strokeWidth: 1.5 },
          labelStyle: { fontSize: 10, fill: '#8e8e93' },
          labelBgStyle: { fill: '#1c1c1e', fillOpacity: 0.9 },
          labelBgPadding: [4, 6] as [number, number],
          labelBgBorderRadius: 4,
        });
      }
    }
  }
  return edges;
}

export function TreeEditor({ config, onChange }: TreeEditorProps) {
  const [editingNode, setEditingNode] = useState<TreeNodeType | ResultNode | null>(null);

  const initialNodes = useMemo(() => layoutTree(config), [config]);
  const edges = useMemo(() => buildEdges(config), [config]);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const treeNode = config.nodes[node.id];
      const resultNode = config.results[node.id];
      setEditingNode(treeNode || resultNode || null);
    },
    [config]
  );

  const handleSaveNode = useCallback(
    (updated: TreeNodeType | ResultNode) => {
      if ('options' in updated) {
        const newNodes = { ...config.nodes, [updated.id]: updated };
        onChange({ ...config, nodes: newNodes });
      } else {
        const newResults = { ...config.results, [updated.id]: updated };
        onChange({ ...config, results: newResults });
      }
      setEditingNode(null);
    },
    [config, onChange]
  );

  return (
    <div style={{ height: 'calc(100vh - 140px)', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ background: '#000' }}
      >
        <Background color="rgba(118,118,128,0.08)" gap={24} />
        <Controls
          showInteractive={false}
          style={{ background: '#1c1c1e', borderRadius: 10, border: 'none' }}
        />
        <Panel position="top-left">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: 8, backdropFilter: 'blur(8px)' }}>
            双击节点编辑
          </div>
        </Panel>
      </ReactFlow>

      {editingNode && (
        <TreeNodeEditor
          node={editingNode}
          onSave={handleSaveNode}
          onClose={() => setEditingNode(null)}
        />
      )}
    </div>
  );
}
