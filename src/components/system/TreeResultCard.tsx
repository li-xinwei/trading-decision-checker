import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ResultNode } from '../../types/decisionTree';

type TreeResultCardProps = NodeProps & {
  data: { node: ResultNode };
};

const typeColors: Record<string, { bg: string; border: string; color: string }> = {
  go: { bg: 'rgba(48,209,88,0.08)', border: 'rgba(48,209,88,0.3)', color: '#30d158' },
  caution: { bg: 'rgba(255,214,10,0.08)', border: 'rgba(255,214,10,0.3)', color: '#ffd60a' },
  'no-go': { bg: 'rgba(255,69,58,0.08)', border: 'rgba(255,69,58,0.3)', color: '#ff453a' },
};

export function TreeResultCard({ data }: TreeResultCardProps) {
  const { node } = data;
  const style = typeColors[node.type] || typeColors['no-go'];

  return (
    <div
      style={{
        background: style.bg,
        borderRadius: 12,
        padding: '12px 16px',
        minWidth: 160,
        maxWidth: 220,
        border: `0.5px solid ${style.border}`,
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: style.color, width: 6, height: 6, border: 'none' }} />

      <div style={{ fontSize: 10, fontWeight: 600, color: style.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {node.type === 'go' ? 'GO' : node.type === 'caution' ? 'CAUTION' : 'NO-GO'}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#f5f5f7', lineHeight: 1.35 }}>
        {node.title.replace(/^.*?(?=[\u4e00-\u9fffA-Za-z])/, '')}
      </div>
    </div>
  );
}
