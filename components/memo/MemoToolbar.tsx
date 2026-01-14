// =============================================================================
// PageMinder - Memo Toolbar Component
// =============================================================================

import { Memo } from '@/types';
import { PASTEL_COLORS, COLOR_PALETTE } from '@/lib/constants';
import { useState } from 'react';

interface MemoToolbarProps {
  memo: Memo;
  isPinned: boolean;
  onEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onColorChange: (color: string) => void;
}

/**
 * メモのツールバー（下部アイコンバー）
 */
export function MemoToolbar({
  memo,
  isPinned,
  onEdit,
  onTogglePin,
  onDelete,
  onColorChange,
}: MemoToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
      // 3秒後に確認状態をリセット
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(memo.content);
    } catch {
      // フォールバック
      console.error('Failed to copy to clipboard');
    }
  };

  return (
    <div
      className="flex items-center justify-between px-2 py-1 border-t"
      style={{ borderColor: 'rgba(0,0,0,0.1)', backgroundColor: 'rgba(0,0,0,0.05)' }}
    >
      {/* 左側アイコン */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={isPinned ? '📍' : '📌'}
          title={isPinned ? 'ピン解除' : 'ピン止め'}
          onClick={onTogglePin}
          active={isPinned}
        />
        <ToolbarButton icon="✏️" title="編集" onClick={onEdit} />
        <ToolbarButton icon="📋" title="コピー" onClick={handleCopy} />
        
        {/* カラーピッカー */}
        <div className="relative">
          <ToolbarButton
            icon="🎨"
            title="背景色"
            onClick={() => setShowColorPicker(!showColorPicker)}
            active={showColorPicker}
          />
          {showColorPicker && (
            <ColorPicker
              colors={COLOR_PALETTE}
              currentColor={memo.backgroundColor ?? PASTEL_COLORS.yellow}
              onSelect={(color) => {
                onColorChange(color);
                setShowColorPicker(false);
              }}
              onClose={() => setShowColorPicker(false)}
            />
          )}
        </div>
      </div>

      {/* 右側アイコン */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={showDeleteConfirm ? '⚠️' : '🗑️'}
          title={showDeleteConfirm ? '確認: 本当に削除？' : '削除'}
          onClick={handleDelete}
          danger={showDeleteConfirm}
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Internal Components
// -----------------------------------------------------------------------------

interface ToolbarButtonProps {
  icon: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}

function ToolbarButton({ icon, title, onClick, active, danger }: ToolbarButtonProps) {
  return (
    <button
      className={`
        w-7 h-7 flex items-center justify-center rounded transition-all
        hover:bg-black/10 active:scale-95
        ${active ? 'bg-black/10' : ''}
        ${danger ? 'animate-pulse' : ''}
      `}
      title={title}
      onClick={onClick}
    >
      <span className="text-base">{icon}</span>
    </button>
  );
}

interface ColorPickerProps {
  colors: readonly string[];
  currentColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

function ColorPicker({ colors, currentColor, onSelect, onClose }: ColorPickerProps) {
  return (
    <div
      className="absolute bottom-full left-0 mb-1 p-2 bg-white rounded-lg shadow-xl border grid grid-cols-4 gap-1"
      style={{ zIndex: 1000000 }}
    >
      {colors.map((color) => (
        <button
          key={color}
          className={`
            w-6 h-6 rounded-full transition-transform hover:scale-110
            ${color === currentColor ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
          `}
          style={{ backgroundColor: color }}
          onClick={() => onSelect(color)}
          title={color}
        />
      ))}
    </div>
  );
}
