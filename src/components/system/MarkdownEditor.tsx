import Markdown from 'react-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div className="markdown-editor">
      <div className="markdown-editor-pane">
        <div className="markdown-pane-header">编辑</div>
        <textarea
          className="markdown-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="markdown-editor-pane">
        <div className="markdown-pane-header">预览</div>
        <div className="markdown-preview">
          <Markdown>{value}</Markdown>
        </div>
      </div>
    </div>
  );
}
