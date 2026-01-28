// =============================================================================
// PageMinder - Memo Component
// =============================================================================

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { marked, Renderer } from 'marked';
import { Memo as MemoType, MemoPosition, GlobalSettings } from '@/types';
import { MemoToolbar } from './MemoToolbar';
import { MemoEditor } from './MemoEditor';
import { SettingsModal } from './SettingsModal';
import { ConfirmDialog } from './ConfirmDialog';
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
  DRAG_THRESHOLD,
} from '@/lib/constants';

interface MemoProps {
  memo: MemoType;
  settings: GlobalSettings;
  onUpdate: (memo: MemoType) => void;
  onDelete: (memoId: string) => void;
  /** アクティブ化トリガーで表示されている場合true */
  isActivated?: boolean;
  /** 要素ピッカーを起動するコールバック */
  onStartElementPicker?: () => void;
  /** 設定モーダルを自動的に開く */
  shouldOpenSettings?: boolean;
  /** 設定モーダルが開かれた時のコールバック */
  onSettingsOpened?: () => void;
  /** アクティブ化の一時停止 */
  onPauseActivation?: (reason: string) => void;
  /** アクティブ化の一時停止解除 */
  onResumeActivation?: (reason: string) => void;
  /** アクティブ化オーバーレイからのドラッグハンドラ */
  activationDragHandle?: (e: React.MouseEvent) => void;
}

/**
 * 個別メモコンポーネント
 */
export function Memo({ memo, settings, onUpdate, onDelete, isActivated = false, onStartElementPicker, shouldOpenSettings, onSettingsOpened, onPauseActivation, onResumeActivation, activationDragHandle }: MemoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // アニメーション状態: enter=出現, idle=通常, shrink=最小化中, expand=展開中, exit=削除中
  const [animationState, setAnimationState] = useState<'enter' | 'idle' | 'shrink' | 'expand' | 'exit'>('enter');
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMinimizedRef = useRef(memo.minimized);

  // markedのカスタムレンダラー: リンクを新しいタブで開く
  const customRenderer = useMemo(() => {
    const renderer = new Renderer();
    renderer.link = ({ href, title, text }) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    };
    return renderer;
  }, []);

  // Markdownをパース（リンクは新しいタブで開く）
  const parsedContent = useMemo(() => {
    if (!memo.content) return '';
    return marked(memo.content, { renderer: customRenderer }) as string;
  }, [memo.content, customRenderer]);

  // h1からタイトルを自動抽出（タイトルが未設定の場合）
  useEffect(() => {
    if (!memo.title && memo.content) {
      const h1Match = memo.content.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1]) {
        onUpdate({ ...memo, title: h1Match[1].trim() });
      }
    }
  }, [memo.content]);

  // セレクタ選択後に設定モーダルを自動的に開く
  useEffect(() => {
    if (shouldOpenSettings) {
      setIsSettingsOpen(true);
    }
  }, [shouldOpenSettings]);



  // アクティブ化の一時停止制御（設定中）
  useEffect(() => {
    if (isSettingsOpen) {
      onPauseActivation?.('settings');
    } else {
      onResumeActivation?.('settings');
    }
  }, [isSettingsOpen, onPauseActivation, onResumeActivation]);

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

  // ドラッグ機能 (アクティブ化時は無効化)
  const { position: dragPosition, handleMouseDown: originalHandleDragStart, isDragging } = useDraggable({
    initialPosition: { x: position.x, y: position.y },
    onPositionChange: (newPos) => {
      updatePosition({ x: newPos.x, y: newPos.y });
    },
    disabled: isEditing || isActivated,
  });

  // アクティブ化の一時停止制御（ドラッグ中）
  useEffect(() => {
    if (isDragging) {
      onPauseActivation?.('drag');
    } else {
      onResumeActivation?.('drag');
    }
  }, [isDragging, onPauseActivation, onResumeActivation]);

  // カスタムドラッグ開始ハンドラ（開始位置を記録）
  const handleDragStart = (e: React.MouseEvent) => {
    // アクティブ化時は親のハンドラを使用
    if (isActivated && activationDragHandle) {
        activationDragHandle(e);
        return;
    }

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
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
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

  // ピン止めトグル（アクティブ化時は無効、または親で制御する必要あり）
  // 簡易的にアクティブ化時はピン止めボタンを非表示にする等の検討も必要だが、
  // 現状はアクティブ化されていても「固定モード」への切り替えとして使えるよう残す
  // アクティブ化時でNear Elementモードの場合、ピン留めすると位置がずれる可能性がある
  // ActivationOverlay側でモード切替をハンドルするのが理想的
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

  // 編集中に外側をクリックしたら保存して終了
  const pendingContentRef = useRef(memo.content);
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      // composedPath()を使ってShadow DOM内のイベントを正しく処理
      const path = e.composedPath();
      const isInsideMemo = path.some(el => el === containerRef.current);
      
      if (!isInsideMemo) {
        // 外側クリック → 保存して終了
        onUpdate({ ...memo, content: pendingContentRef.current });
        setIsEditing(false);
      }
    };

    // 少し遅延させて登録（ダブルクリックイベントと競合しないように）
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, memo, onUpdate]);

  // メモ自体の背景色/文字色（パステルカラーが基本）
  const memoBgColor = memo.backgroundColor ?? PASTEL_COLORS.yellow;
  const memoTextColor = memo.textColor ?? '#333333';
  const fontSize = memo.fontSize ?? 14;

  // 初回マウント時にアニメーション状態をidleに遷移
  useEffect(() => {
    const timer = setTimeout(() => setAnimationState('idle'), 250);
    return () => clearTimeout(timer);
  }, []);

  // 最小化/展開の遷移を検知してアニメーション適用
  useEffect(() => {
    // 前回の状態と異なる場合のみ処理
    if (prevMinimizedRef.current !== memo.minimized) {
      // 最小化状態が変わった
      if (memo.minimized) {
        // 展開 → 最小化（アイコンのバウンスイン）
        setAnimationState('enter');
      } else {
        // 最小化 → 展開（展開アニメーション）
        setAnimationState('expand');
      }
      prevMinimizedRef.current = memo.minimized;
      
      // アニメーション完了後にidleに戻す
      const timer = setTimeout(() => setAnimationState('idle'), 300);
      return () => clearTimeout(timer);
    }
  }, [memo.minimized]);

  // アニメーションクラス決定
  const getAnimationClass = () => {
    switch (animationState) {
      case 'enter': return 'memo-enter';
      case 'idle': return ''; // 通常時はクラスなし
      case 'shrink': return 'memo-shrink';
      case 'expand': return 'memo-expand';
      case 'exit': return 'memo-exit';
      default: return '';
    }
  };

  // 最小化表示（アイコンのみ）
  if (memo.minimized) {
    return (
      <div
        className={`memo-enter-active ${isActivated ? '' : 'fixed'} cursor-pointer transition-transform hover:scale-110 z-[2147483647]`}
        style={{
          // アクティブ化時は親の位置に従うためtop/leftを設定しない
          ...(isActivated ? {} : {
              left: `${dragPosition.x}px`,
              top: `${dragPosition.y}px`,
          }),
          width: '40px',
          height: '40px',
          backgroundColor: memoBgColor,
          borderRadius: '50%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: memoTextColor,
          border: `2px solid ${theme.border}`,
        }}
        onClick={toggleMinimize}
        // アクティブ化時はドラッグイベントを親に伝播させる必要はない（アイコンクリックで展開するため）
        // もしアイコンのままドラッグ移動したい場合はここにもハンドラが必要だが、
        // 最小化時は「展開」が主アクションなので一旦ドラッグは非対応（または親がWrapperでハンドルするならOK）
        // 今回のActivationOverlayはWrapperでハンドルしているので、Overlay側でドラッグ可能
      >
        <span style={{ fontSize: '20px' }}>
          {memo.icon ? memo.icon : '📝'}
        </span>
      </div>
    );
  }

  // ベーススタイル（共通）
  const baseStyle: React.CSSProperties = {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: isDragging ? 'none' : 'box-shadow 0.2s, transform 0.2s',
  };

  // 削除確認ダイアログ
  if (isDeleteDialogOpen) {
    return (
      <div 
        style={{
          position: 'fixed' as const, // ConfirmDialogは常にfixedで画面中央などに表示したいが、Overlay内にあると制約を受ける
          // ここではポータルを使わずに実装しているため、Overlayの影響を受ける。
          // ただ、OverlayのzIndexは十分に高いので問題ないはず。
          // ただし、座標はMemoの位置基準になる可能性がある。
          ...(isActivated ? {} : {
            left: `${dragPosition.x}px`,
            top: `${dragPosition.y}px`,
          }),
          zIndex: 2147483647,
        }}
      >
        <ConfirmDialog
          settings={settings}
          title="メモを削除"
          message="このメモを削除しますか？"
          confirmText="削除"
          cancelText="キャンセル"
          onConfirm={() => {
            setAnimationState('exit');
            setIsDeleting(true);
            setTimeout(() => {
                onDelete(memo.id);
            }, 300); // アニメーション時間
          }}
          onCancel={() => setIsDeleteDialogOpen(false)}
          isDanger={true}
        />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={getAnimationClass()}
        style={{
          ...baseStyle,
          // アクティブ化時はposition指定を親に任せる（relative的な振る舞い）
          // ただし、ドラッグ中はスムーズに動かすために固定サイズなどは維持
          ...(isActivated ? {
              position: 'relative', // 親のdiv内に配置
              // dragPositionは使わない（親が動くため）
              zIndex: 1, // Overlay内での順序
          } : {
              position: position.pinned ? 'absolute' : 'fixed',
              left: `${dragPosition.x}px`,
              top: `${dragPosition.y}px`,
              zIndex: 999999,
          }),
          width: `${size.width}px`,
          height: `${size.height}px`,
          backgroundColor: memoBgColor,
          color: memoTextColor,
          fontSize: `${fontSize}px`,
          borderRadius: '10px',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.border}33`,
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
          onDoubleClick={toggleMinimize}
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
          style={{ 
            flex: 1, 
            overflow: 'hidden',  // 基本はhidden、内部でスクロール制御
            padding: '12px', 
            cursor: isEditing ? 'text' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
          }}
          onMouseDown={(e) => {
            // リンクをクリックした場合はドラッグを開始しない
            const target = e.target as HTMLElement;
            if (target.tagName === 'A' || target.closest('a')) {
              return; // リンククリック時はドラッグ処理をスキップ
            }
            if (!isEditing) {
              handleDragStart(e);
            }
          }}
          onDoubleClick={!isEditing ? () => setIsEditing(true) : undefined}
        >
          {isEditing ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <MemoEditor
                content={memo.content}
                settings={settings}
                onSave={handleSaveContent}
                onCancel={() => setIsEditing(false)}
                onChange={(newContent) => { pendingContentRef.current = newContent; }}
              />
            </div>
          ) : (
            <div
              data-memo-id={memo.id}
              style={{ 
                flex: 1,
                fontSize: `${fontSize}px`,
                overflow: 'auto',
              }}
              onClick={(e) => {
                // リンククリック処理
                const target = e.target as HTMLElement;
                if (target.tagName === 'A') {
                  e.preventDefault();
                  e.stopPropagation();
                  const href = target.getAttribute('href');
                  if (href) {
                    window.open(href, '_blank', 'noopener,noreferrer');
                  }
                }
              }}
            >
              {memo.content ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: parsedContent }}
                  style={{ 
                    backgroundColor: 'transparent',
                    fontSize: 'inherit',
                  }}
                />
              ) : (
                <span style={{ opacity: 0.6, display: 'block', textAlign: 'center', marginTop: '20px' }}>ダブルクリックで編集</span>
              )}
            </div>
          )}
        </div>

        {/* ツールバー（ドラッグ可能） */}
        <div
          style={{ cursor: 'move' }}
          onMouseDown={handleDragStart}
        >
          <MemoToolbar
            memo={memo}
            settings={settings}
            isPinned={position.pinned}
            onTogglePin={togglePin}
            onDelete={() => setIsDeleteDialogOpen(true)}
            onColorChange={(color) => onUpdate({ ...memo, backgroundColor: color })}
            onFontSizeChange={(size) => onUpdate({ ...memo, fontSize: size })}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>

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
          onClose={() => {
            setIsSettingsOpen(false);
            onSettingsOpened?.(); // モーダル閉じる時にフラグクリア
          }}
          onStartElementPicker={() => {
            setIsSettingsOpen(false); // モーダルを閉じる
            onStartElementPicker?.(); // 親に伝える
          }}
          initialTab={shouldOpenSettings ? 'activation' : 'general'}
        />
      )}

      {/* 削除確認ダイアログ */}
      {isDeleteDialogOpen && (
        <ConfirmDialog
          settings={settings}
          title="メモを削除"
          message="このメモを削除してもよろしいですか？この操作は取り消せません。"
          confirmText="削除"
          cancelText="キャンセル"
          onConfirm={() => {
            setIsDeleteDialogOpen(false);
            // 削除アニメーション開始
            setAnimationState('exit');
            setIsDeleting(true);
            // アニメーション完了後に実際に削除
            setTimeout(() => {
              onDelete(memo.id);
            }, 200);
          }}
          onCancel={() => setIsDeleteDialogOpen(false)}
          isDanger={true}
        />
      )}
    </>
  );
}
