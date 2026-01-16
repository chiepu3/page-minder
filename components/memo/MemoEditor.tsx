// =============================================================================
// PageMinder - Memo Editor Component
// =============================================================================

import { useState, useEffect } from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { GlobalSettings } from '@/types';
import { THEMES } from '@/lib/constants';

interface MemoEditorProps {
  content: string;
  settings: GlobalSettings;
  onSave: (content: string) => void;
  onCancel: () => void;
}

/**
 * メモ編集コンポーネント（Markdownエディタ搭載）
 */
export function MemoEditor({ content, settings, onSave, onCancel }: MemoEditorProps) {
  const [value, setValue] = useState(content);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  // テーマ取得
  const theme = THEMES[settings.theme === 'system' ? 'dark' : settings.theme];
  const isDark = settings.theme === 'dark';

  // グローバルキーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSave(value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [value, onSave, onCancel]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
      {/* プレビューモード切り替えボタン */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
        <button
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '4px',
            border: `1px solid ${theme.border}`,
            backgroundColor: previewMode === 'edit' ? theme.accent : 'transparent',
            color: previewMode === 'edit' ? (isDark ? '#1a1a2e' : '#fff') : 'inherit',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onClick={() => setPreviewMode('edit')}
        >
          📝 編集
        </button>
        <button
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '4px',
            border: `1px solid ${theme.border}`,
            backgroundColor: previewMode === 'preview' ? theme.accent : 'transparent',
            color: previewMode === 'preview' ? (isDark ? '#1a1a2e' : '#fff') : 'inherit',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onClick={() => setPreviewMode('preview')}
        >
          👁️ プレビュー
        </button>
      </div>

      {/* Markdownエディタ */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          borderRadius: '6px',
          border: `1px solid ${theme.border}`,
        }}
        data-color-mode={isDark ? 'dark' : 'light'}
      >
        <MDEditor
          value={value}
          onChange={(val) => setValue(val || '')}
          preview={previewMode}
          height="100%"
          hideToolbar={false}
          enableScroll={true}
          visibleDragbar={false}
          commands={[
            commands.bold,
            commands.italic,
            commands.strikethrough,
            commands.hr,
            commands.divider,
            commands.title,
            commands.divider,
            commands.link,
            commands.quote,
            commands.code,
            commands.divider,
            commands.unorderedListCommand,
            commands.orderedListCommand,
            commands.checkedListCommand,
          ]}
          extraCommands={[]}
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)',
            fontSize: `${settings.defaultFontSize}px`,
          }}
        />
      </div>

      {/* 保存・キャンセルボタン */}
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
            color: isDark ? '#1a1a2e' : '#fff',
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
