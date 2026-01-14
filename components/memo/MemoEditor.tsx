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
    <div className="flex flex-col h-full gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
        placeholder="メモを入力..."
      />
      <div className="flex justify-end gap-2">
        <button
          className="px-3 py-1 text-sm rounded border hover:bg-gray-100 transition-colors"
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button
          className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          onClick={() => onSave(value)}
        >
          保存 (Ctrl+Enter)
        </button>
      </div>
    </div>
  );
}
