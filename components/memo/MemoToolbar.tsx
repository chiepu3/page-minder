// =============================================================================
// PageMinder - Memo Toolbar Component
// =============================================================================

import { Memo } from '@/types';
import { PASTEL_COLORS, COLOR_PALETTE } from '@/lib/constants';
import { useState } from 'react';
import { IconPin, IconPinOff, IconEdit, IconCopy, IconPalette, IconDelete, IconWarning } from '@/components/icons';

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
      console.error('Failed to copy to clipboard');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
        borderTop: '1px solid rgba(0,0,0,0.1)',
        backgroundColor: 'rgba(0,0,0,0.05)',
      }}
    >
      {/* 左側アイコン */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <ToolbarButton
          icon={isPinned ? <IconPinOff size={16} /> : <IconPin size={16} />}
          title={isPinned ? 'ピン解除（スクロール追従にする）' : 'ピン止め（ページ内固定にする）'}
          onClick={onTogglePin}
          active={isPinned}
        />
        <ToolbarButton 
          icon={<IconEdit size={16} />} 
          title="編集" 
          onClick={onEdit} 
        />
        <ToolbarButton 
          icon={<IconCopy size={16} />} 
          title="コピー" 
          onClick={handleCopy} 
        />
        
        {/* カラーピッカー */}
        <div style={{ position: 'relative' }}>
          <ToolbarButton
            icon={<IconPalette size={16} />}
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
            />
          )}
        </div>
      </div>

      {/* 右側アイコン */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <ToolbarButton
          icon={showDeleteConfirm ? <IconWarning size={16} color="#d32f2f" /> : <IconDelete size={16} />}
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
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}

function ToolbarButton({ icon, title, onClick, active, danger }: ToolbarButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      style={{
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        border: 'none',
        background: active || isHovered ? 'rgba(0,0,0,0.1)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: isHovered ? 'scale(0.95)' : 'scale(1)',
        color: danger ? '#d32f2f' : '#555',
      }}
      title={title}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon}
    </button>
  );
}

interface ColorPickerProps {
  colors: readonly string[];
  currentColor: string;
  onSelect: (color: string) => void;
}

function ColorPicker({ colors, currentColor, onSelect }: ColorPickerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '0',
        marginBottom: '4px',
        padding: '8px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        border: '1px solid rgba(0,0,0,0.1)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px',
        zIndex: 1000000,
      }}
    >
      {colors.map((color) => (
        <button
          key={color}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: color === currentColor ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.1)',
            backgroundColor: color,
            cursor: 'pointer',
            transition: 'transform 0.1s ease',
          }}
          onClick={() => onSelect(color)}
          title={color}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      ))}
    </div>
  );
}
