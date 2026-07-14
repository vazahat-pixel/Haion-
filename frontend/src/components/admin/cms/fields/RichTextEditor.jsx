import { useRef, useCallback, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Quote,
} from 'lucide-react';
import { cn } from '@/utils/cn';

function ToolbarButton({ icon: Icon, onClick, active, title }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        'rounded p-1.5 hover:bg-surface-2 transition-colors',
        active && 'bg-surface-3 text-primary'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export function RichTextEditor({ value = '', onChange, placeholder = 'Enter description…' }) {
  const editorRef = useRef(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (editorRef.current && value !== lastValue.current) {
      editorRef.current.innerHTML = value || '';
      lastValue.current = value;
    }
  }, [value]);

  const exec = useCallback((command, val = null) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    const html = editorRef.current?.innerHTML ?? '';
    lastValue.current = html;
    onChange?.(html);
  }, [onChange]);

  const handleInput = () => {
    const html = editorRef.current?.innerHTML ?? '';
    lastValue.current = html;
    onChange?.(html);
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:', 'https://');
    if (url) exec('createLink', url);
  };

  return (
    <div className="rounded-lg border border-surface-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-surface-3 bg-surface-2 px-2 py-1.5">
        <ToolbarButton icon={Bold} onClick={() => exec('bold')} title="Bold" />
        <ToolbarButton icon={Italic} onClick={() => exec('italic')} title="Italic" />
        <ToolbarButton icon={Underline} onClick={() => exec('underline')} title="Underline" />
        <span className="mx-1 h-4 w-px bg-surface-3" />
        <ToolbarButton icon={List} onClick={() => exec('insertUnorderedList')} title="Bullet list" />
        <ToolbarButton icon={ListOrdered} onClick={() => exec('insertOrderedList')} title="Numbered list" />
        <ToolbarButton icon={Quote} onClick={() => exec('formatBlock', 'blockquote')} title="Quote" />
        <span className="mx-1 h-4 w-px bg-surface-3" />
        <ToolbarButton icon={AlignLeft} onClick={() => exec('justifyLeft')} title="Align left" />
        <ToolbarButton icon={AlignCenter} onClick={() => exec('justifyCenter')} title="Align center" />
        <ToolbarButton icon={AlignRight} onClick={() => exec('justifyRight')} title="Align right" />
        <span className="mx-1 h-4 w-px bg-surface-3" />
        <ToolbarButton icon={Link2} onClick={addLink} title="Insert link" />
        <span className="mx-1 h-4 w-px bg-surface-3" />
        <ToolbarButton icon={Undo2} onClick={() => exec('undo')} title="Undo" />
        <ToolbarButton icon={Redo2} onClick={() => exec('redo')} title="Redo" />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[120px] max-h-[300px] overflow-y-auto px-3 py-2 text-sm focus:outline-none prose prose-sm max-w-none"
        onInput={handleInput}
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--color-text-tertiary, #9ca3af);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
