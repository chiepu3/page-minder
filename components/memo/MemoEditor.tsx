// =============================================================================
// PageMinder - Memo Editor Component
// =============================================================================

import { useState, useRef, useEffect } from 'react';
import { GlobalSettings } from '@/types';
import { THEMES } from '@/lib/constants';

interface MemoEditorProps {
  content: string;
  settings: GlobalSettings;
  onSave: (content: string) => void;
  onCancel: () => void;
}

/**
 * メモ編集コンポーネント
 */
export function MemoEditor({ content, settings, onSave, onCancel }: MemoEditorProps) {
  const [value, setValue] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // テーマ取得
  const theme = THEMES[settings.theme === 'system' ? 'dark' : settings.theme];

  // 初期フォーカス
  useEffect(() => {
    textareaRef.current?.focus();
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
          border: `1px solid ${theme.border}`,
          borderRadius: '6px',
          resize: 'none',
          outline: 'none',
          backgroundColor: settings.theme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)',
          color: 'inherit',
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
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '6px',
            border: `1px solid ${theme.border}`,
            backgroundColor: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onClick={onCancel}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          キャンセル
        </button>
        <button
          style={{
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            backgroundColor: theme.accent,
            color: settings.theme === 'dark' ? '#1a1a2e' : '#fff',
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
          onClick={() => onSave(value)}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          保存 (Ctrl+Enter)
        </button>
      </div>
    </div>
  );
}
