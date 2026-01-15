// =============================================================================
// PageMinder - Memo Editor Component
// =============================================================================

import { useState, useRef, useEffect } from 'react';

interface MemoEditorProps {
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

/**
 * メモ編集コンポーネント
 */
export function MemoEditor({ content, onSave, onCancel }: MemoEditorProps) {
  const [value, setValue] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 初期フォーカス
  useEffect(() => {
    textareaRef.current?.focus();
    // カーソルを末尾に
    textareaRef.current?.setSelectionRange(value.length, value.length);
  }, []);

  // キーボードショートカット
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave(value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          width: '100%',
          padding: '8px',
          border: '1px solid rgba(0,0,0,0.2)',
          borderRadius: '6px',
          resize: 'none',
          outline: 'none',
          backgroundColor: 'rgba(255,255,255,0.9)',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 1.5,
        }}
        placeholder="メモを入力..."
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: '6px',
            border: '1px solid rgba(0,0,0,0.2)',
            backgroundColor: '#fff',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onClick={onCancel}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
        >
          キャンセル
        </button>
        <button
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#7c3aed',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onClick={() => onSave(value)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6d28d9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7c3aed')}
        >
          保存 (Ctrl+Enter)
        </button>
      </div>
    </div>
  );
}
