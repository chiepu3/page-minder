// =============================================================================
// PageMinder - Memo Component
// =============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { Memo as MemoType, MemoPosition, GlobalSettings } from '@/types';
import { MemoToolbar } from './MemoToolbar';
import { MemoEditor } from './MemoEditor';
import { SettingsModal } from './SettingsModal';
import { useDraggable } from '@/hooks/useDraggable';
import { useResizable } from '@/hooks/useResizable';
import { IconStickyNote, IconMinimize } from '@/components/icons';
import {
  DEFAULT_MEMO_SIZE,
  MINIMIZED_SIZE,
  MIN_MEMO_SIZE,
  MAX_MEMO_SIZE,
  PASTEL_COLORS,
  THEMES,
} from '@/lib/constants';

interface MemoProps {
  memo: MemoType;
  settings: GlobalSettings;
  onUpdate: (memo: MemoType) => void;
  onDelete: (memoId: string) => void;
}

/**
 * 個別メモコンポーネント
 */
export function Memo({ memo, settings, onUpdate, onDelete }: MemoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // テーマ取得
  const theme = THEMES[settings.theme === 'system' ? 'dark' : settings.theme];

  // 現在のURLパターンに対応するポジションを取得（なければデフォルト）
  const currentPatternId = memo.urlPatterns[0]?.id ?? 'default';
  const position: MemoPosition = memo.positions[currentPatternId] ?? {
    x: 100,
    y: 100,
    width: DEFAULT_MEMO_SIZE.width,
    height: DEFAULT_MEMO_SIZE.height,
    pinned: false,
  };

  // ドラッグ判定用のref（クリック/ドラッグ判別）
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // ドラッグ機能
  const { position: dragPosition, handleMouseDown: originalHandleDragStart, isDragging } = useDraggable({
    initialPosition: { x: position.x, y: position.y },
    onPositionChange: (newPos) => {
      updatePosition({ x: newPos.x, y: newPos.y });
    },
    disabled: isEditing,
  });

  // カスタムドラッグ開始ハンドラ（開始位置を記録）
  const handleDragStart = (e: React.MouseEvent) => {
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    originalHandleDragStart(e);
  };

  // ドラッグ距離を追跡
  useEffect(() => {
    if (isDragging) {
      const checkDragDistance = (e: MouseEvent) => {
        const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
        const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
        if (dx > 5 || dy > 5) {
          hasDraggedRef.current = true;
        }
      };
      document.addEventListener('mousemove', checkDragDistance);
      return () => document.removeEventListener('mousemove', checkDragDistance);
    }
  }, [isDragging]);

  // リサイズ機能
  const { size, handleMouseDown: handleResizeStart } = useResizable({
    initialSize: { width: position.width, height: position.height },
    minSize: MIN_MEMO_SIZE,
    maxSize: MAX_MEMO_SIZE,
    onSizeChange: (newSize) => {
      updatePosition({ width: newSize.width, height: newSize.height });
    },
  });

  // ポジション更新
  const updatePosition = useCallback(
    (updates: Partial<MemoPosition>) => {
      const newPositions = {
        ...memo.positions,
        [currentPatternId]: {
          ...position,
          ...updates,
        },
      };
      onUpdate({ ...memo, positions: newPositions });
    },
    [memo, position, currentPatternId, onUpdate]
  );

  // 最小化トグル
  const toggleMinimize = () => {
    if (hasDraggedRef.current) return;
    onUpdate({ ...memo, minimized: !memo.minimized });
  };

  // ピン止めトグル
  const togglePin = () => {
    const newIsPinned = !position.pinned;
    let newX = dragPosition.x;
    let newY = dragPosition.y;
    
    if (newIsPinned) {
      newX += window.scrollX;
      newY += window.scrollY;
    } else {
      newX -= window.scrollX;
      newY -= window.scrollY;
    }
    
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    
    updatePosition({ 
      pinned: newIsPinned,
      x: newX,
      y: newY,
    });
  };

  // 編集完了
  const handleSaveContent = (content: string) => {
    onUpdate({ ...memo, content });
    setIsEditing(false);
  };

  // メモ自体の背景色/文字色（パステルカラーが基本）
  const memoBgColor = memo.backgroundColor ?? PASTEL_COLORS.yellow;
  const memoTextColor = memo.textColor ?? '#333333';
  const fontSize = memo.fontSize ?? 14;

  const baseStyle = {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  if (memo.minimized) {
    return (
      <div
        ref={containerRef}
        style={{
          ...baseStyle,
          position: 'fixed',
          left: `${dragPosition.x}px`,
          top: `${dragPosition.y}px`,
          width: `${MINIMIZED_SIZE.width}px`,
          height: `${MINIMIZED_SIZE.height}px`,
          backgroundColor: memoBgColor,
          zIndex: 999999,
          cursor: 'pointer',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease',
        }}
        onClick={toggleMinimize}
        onMouseDown={handleDragStart}
        title={memo.title ?? 'メモ'}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <IconStickyNote size={18} color={memoTextColor} />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        style={{
          ...baseStyle,
          position: position.pinned ? 'absolute' : 'fixed',
          left: `${dragPosition.x}px`,
          top: `${dragPosition.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          backgroundColor: memoBgColor,
          color: memoTextColor,
          fontSize: `${fontSize}px`,
          zIndex: 999999,
          borderRadius: '10px',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.border}33`, // テーマに合わせた微細なボーダー
        }}
      >
        {/* ドラッグハンドル（タイトルバー） */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: 'rgba(0,0,0,0.08)',
            cursor: 'move',
            userSelect: 'none',
          }}
          onMouseDown={handleDragStart}
        >
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: '12px' }}>
            {memo.title ?? 'メモ'}
          </span>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              opacity: 0.6,
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={toggleMinimize}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            <IconMinimize size={18} color={memoTextColor} />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div 
          style={{ flex: 1, overflowY: 'auto', padding: '12px', cursor: 'move' }}
          onMouseDown={!isEditing ? handleDragStart : undefined}
        >
          {isEditing ? (
            <MemoEditor
              content={memo.content}
              settings={settings}
              onSave={handleSaveContent}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div
              style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                minHeight: '40px',
                fontSize: `${fontSize}px`,
              }}
              onDoubleClick={() => setIsEditing(true)}
            >
              {memo.content || 'ダブルクリックで編集'}
            </div>
          )}
        </div>

        {/* ツールバー */}
        <MemoToolbar
          memo={memo}
          settings={settings}
          isPinned={position.pinned}
          onEdit={() => setIsEditing(true)}
          onTogglePin={togglePin}
          onDelete={() => onDelete(memo.id)}
          onColorChange={(color) => onUpdate({ ...memo, backgroundColor: color })}
          onFontSizeChange={(size) => onUpdate({ ...memo, fontSize: size })}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* リサイズハンドル */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '16px',
            height: '16px',
            cursor: 'se-resize',
            background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.15) 50%)',
          }}
          onMouseDown={handleResizeStart}
        />
      </div>

      {/* 設定モーダル */}
      {isSettingsOpen && (
        <SettingsModal
          memo={memo}
          settings={settings}
          onUpdate={onUpdate}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
}
