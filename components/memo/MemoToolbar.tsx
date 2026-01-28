// =============================================================================
// PageMinder - Memo Toolbar Component
// =============================================================================

import { Memo, GlobalSettings } from '@/types';
import { PASTEL_COLORS, COLOR_PALETTE, THEMES } from '@/lib/constants';
import { useState } from 'react';
import { 
  IconPin, 
  IconPinOff, 
  IconCopy, 
  IconPalette, 
  IconDelete, 
  IconWarning,
  IconFormatSize,
  IconSettings
} from '@/components/icons';

interface MemoToolbarProps {
  memo: Memo;
  settings: GlobalSettings;
  isPinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onColorChange: (color: string) => void;
  onFontSizeChange: (size: number) => void;
  onOpenSettings: () => void;
}

/**
 * メモのツールバー（下部アイコンバー）
 */
export function MemoToolbar({
  memo,
  settings,
  isPinned,
  onTogglePin,
  onDelete,
  onColorChange,
  onFontSizeChange,
  onOpenSettings,
}: MemoToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // テーマ取得
  const theme = THEMES[settings.theme === 'system' ? 'dark' : settings.theme];

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
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
          title={isPinned ? 'ピン解除' : 'ピン止め'}
          onClick={onTogglePin}
          active={isPinned}
        />
        <ToolbarButton 
          icon={<IconCopy size={16} />} 
          title="コピー" 
          onClick={handleCopy} 
        />
        
        {/* フォントサイズ */}
        <div style={{ position: 'relative' }}>
          <ToolbarButton
            icon={<IconFormatSize size={16} />}
            title="フォントサイズ"
            onClick={() => setShowFontSizePicker(!showFontSizePicker)}
            active={showFontSizePicker}
          />
          {showFontSizePicker && (
            <FontSizePicker
              settings={settings}
              currentSize={memo.fontSize ?? 14}
              onSelect={(size) => {
                onFontSizeChange(size);
                setShowFontSizePicker(false);
              }}
            />
          )}
        </div>

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
              settings={settings}
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
          icon={<IconSettings size={16} />}
          title="詳細設定"
          onClick={onOpenSettings}
        />
        <ToolbarButton
          icon={showDeleteConfirm ? <IconWarning size={16} color={theme.danger} /> : <IconDelete size={16} />}
          title={showDeleteConfirm ? '本当に削除？' : '削除'}
          onClick={handleDelete}
          danger={showDeleteConfirm}
          dangerColor={theme.danger}
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
  dangerColor?: string;
}

function ToolbarButton({ icon, title, onClick, active, danger, dangerColor }: ToolbarButtonProps) {
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
        color: danger ? (dangerColor || '#d32f2f') : '#555',
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
  settings: GlobalSettings;
  colors: readonly string[];
  currentColor: string;
  onSelect: (color: string) => void;
}

function ColorPicker({ settings, colors, currentColor, onSelect }: ColorPickerProps) {
  const theme = THEMES[settings.theme === 'system' ? 'dark' : settings.theme];
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '0',
        marginBottom: '4px',
        padding: '8px',
        backgroundColor: theme.bg,
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        border: `1px solid ${theme.border}`,
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
            border: color === currentColor ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
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

interface FontSizePickerProps {
  settings: GlobalSettings;
  currentSize: number;
  onSelect: (size: number) => void;
}

function FontSizePicker({ settings, currentSize, onSelect }: FontSizePickerProps) {
  const theme = THEMES[settings.theme === 'system' ? 'dark' : settings.theme];
  const sizes = [12, 14, 16, 18, 20];
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '0',
        marginBottom: '4px',
        padding: '4px',
        backgroundColor: theme.bg,
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        border: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000000,
        minWidth: '40px',
      }}
    >
      {sizes.map((size) => (
        <button
          key={size}
          style={{
            padding: '4px 8px',
            border: 'none',
            backgroundColor: size === currentSize ? theme.surface : 'transparent',
            color: size === currentSize ? theme.accent : theme.text,
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'center',
            borderRadius: '4px',
          }}
          onClick={() => onSelect(size)}
        >
          {size}px
        </button>
      ))}
    </div>
  );
}
