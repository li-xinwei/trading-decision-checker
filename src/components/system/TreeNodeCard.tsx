import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TreeNode } from '../../types/decisionTree';

type TreeNodeCardProps = NodeProps & {
  data: { node: TreeNode };
};

export function TreeNodeCard({ data }: TreeNodeCardProps) {
  const { node } = data;

  return (
    <div
      style={{
        background: '#1c1c1e',
        borderRadius: 12,
        padding: '12px 16px',
        minWidth: 180,
        maxWidth: 240,
        border: '0.5px solid rgba(84,84,88,0.36)',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#8e8e93', width: 6, height: 6, border: 'none' }} />

      <div style={{ fontSize: 10, fontWeight: 600, color: '#0a84ff', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {node.category}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f5f7', lineHeight: 1.35, marginBottom: 8 }}>
        {node.question}
      </div>
      <div style={{ fontSize: 11, color: '#636366' }}>
        {node.options.length} 个选项
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#8e8e93', width: 6, height: 6, border: 'none' }} />
    </div>
  );
}
