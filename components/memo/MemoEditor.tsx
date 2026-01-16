// =============================================================================
// PageMinder - Memo Editor Component (Markdown対応)
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { GlobalSettings } from '@/types';

interface MemoEditorProps {
  content: string;
  settings: GlobalSettings;
  onSave: (content: string) => void;
  onCancel: () => void;
  onChange?: (content: string) => void;
}

/**
 * Markdownメモ編集コンポーネント
 * - シンプルなtextarea（フルサイズ）
 * - キーボードショートカット: Ctrl+Enter で保存、Escape でキャンセル
 */
export function MemoEditor({ content, settings, onSave, onCancel, onChange }: MemoEditorProps) {
  const [value, setValue] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 初期フォーカス＆カーソルを末尾に
  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(value.length, value.length);
  }, []);

  // 値変更時に親に通知
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue);
  };

  // Escapeキーでキャンセル、Ctrl+Enterで保存
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave(value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [value, onSave, onCancel]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      style={{
        width: '100%',
        height: '100%',
        padding: '0',
        border: 'none',
        resize: 'none',
        outline: 'none',
        backgroundColor: 'transparent',
        color: 'inherit',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        lineHeight: 1.5,
      }}
      placeholder="Markdownで入力..."
    />
  );
}
