// =============================================================================
// PageMinder - Memo Component
// =============================================================================

import { useState, useRef, useCallback } from 'react';
import { Memo as MemoType, MemoPosition } from '@/types';
import { MemoToolbar } from './MemoToolbar';
import { MemoEditor } from './MemoEditor';
import { useDraggable } from '@/hooks/useDraggable';
import { useResizable } from '@/hooks/useResizable';
import {
  DEFAULT_MEMO_SIZE,
  MINIMIZED_SIZE,
  MIN_MEMO_SIZE,
  MAX_MEMO_SIZE,
  PASTEL_COLORS,
} from '@/lib/constants';

interface MemoProps {
  memo: MemoType;
  onUpdate: (memo: MemoType) => void;
  onDelete: (memoId: string) => void;
}

/**
 * 個別メモコンポーネント
 */
export function Memo({ memo, onUpdate, onDelete }: MemoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 現在のURLパターンに対応するポジションを取得（なければデフォルト）
  const currentPatternId = memo.urlPatterns[0]?.id ?? 'default';
  const position: MemoPosition = memo.positions[currentPatternId] ?? {
    x: 100,
    y: 100,
    width: DEFAULT_MEMO_SIZE.width,
    height: DEFAULT_MEMO_SIZE.height,
    pinned: false,
  };

  // ドラッグ機能
  const { position: dragPosition, handleMouseDown: handleDragStart } = useDraggable({
    initialPosition: { x: position.x, y: position.y },
    onPositionChange: (newPos) => {
      updatePosition({ x: newPos.x, y: newPos.y });
    },
    disabled: isEditing,
  });

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
    onUpdate({ ...memo, minimized: !memo.minimized });
  };

  // ピン止めトグル
  const togglePin = () => {
    updatePosition({ pinned: !position.pinned });
  };

  // 編集完了
  const handleSaveContent = (content: string) => {
    onUpdate({ ...memo, content });
    setIsEditing(false);
  };

  // 背景色
  const backgroundColor = memo.backgroundColor ?? PASTEL_COLORS.yellow;
  const textColor = memo.textColor ?? '#333333';
  const fontSize = memo.fontSize ?? 14;

  // 最小化時の表示
  if (memo.minimized) {
    return (
      <div
        ref={containerRef}
        className="fixed cursor-pointer rounded-lg shadow-lg flex items-center justify-center text-xl hover:scale-110 transition-transform"
        style={{
          left: dragPosition.x,
          top: dragPosition.y,
          width: MINIMIZED_SIZE.width,
          height: MINIMIZED_SIZE.height,
          backgroundColor,
          zIndex: 999999,
        }}
        onClick={toggleMinimize}
        onMouseDown={handleDragStart}
        title={memo.title ?? 'メモ'}
      >
        📝
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed rounded-lg shadow-xl overflow-hidden flex flex-col"
      style={{
        left: dragPosition.x,
        top: dragPosition.y,
        width: size.width,
        height: size.height,
        backgroundColor,
        color: textColor,
        fontSize: `${fontSize}px`,
        zIndex: 999999,
        position: position.pinned ? 'absolute' : 'fixed',
      }}
    >
      {/* ドラッグハンドル（タイトルバー） */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-move select-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
        onMouseDown={handleDragStart}
      >
        <span className="font-medium truncate">
          {memo.title ?? 'メモ'}
        </span>
        <button
          className="opacity-60 hover:opacity-100 transition-opacity"
          onClick={toggleMinimize}
        >
          ➖
        </button>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-y-auto p-3">
        {isEditing ? (
          <MemoEditor
            content={memo.content}
            onSave={handleSaveContent}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div
            className="whitespace-pre-wrap break-words"
            onDoubleClick={() => setIsEditing(true)}
          >
            {memo.content || 'ダブルクリックで編集'}
          </div>
        )}
      </div>

      {/* ツールバー */}
      <MemoToolbar
        memo={memo}
        isPinned={position.pinned}
        onEdit={() => setIsEditing(true)}
        onTogglePin={togglePin}
        onDelete={() => onDelete(memo.id)}
        onColorChange={(color) => onUpdate({ ...memo, backgroundColor: color })}
      />

      {/* リサイズハンドル */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeStart}
        style={{
          background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.2) 50%)',
        }}
      />
    </div>
  );
}
