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

  // textareaの高さを内容に応じて自動調整
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 一度高さをリセットしてからscrollHeightを取得
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  // 初期フォーカス＆カーソルを末尾に＆高さ調整
  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(value.length, value.length);
    adjustHeight();
  }, []);

  // 値変更時に親に通知＆高さ調整
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue);
    adjustHeight();
  };

  const [isComposing, setIsComposing] = useState(false);

  // Escapeキーでキャンセル、Ctrl+Enterで保存
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isComposing) return;
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave(value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [value, onSave, onCancel, isComposing]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => setIsComposing(false)}
      style={{
        width: '100%',
        minHeight: '100%',  // 最低でも親要素の高さを確保
        padding: '0',
        border: 'none',
        resize: 'none',
        outline: 'none',
        overflow: 'hidden',  // スクロールバーを非表示（親でスクロール）
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
