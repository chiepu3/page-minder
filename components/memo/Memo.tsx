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
import { getImage } from '@/lib/image-storage';
import { extractImageIds } from '@/lib/image-utils';
import { MEMO_IMG_PROTOCOL } from '@/lib/constants';
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
  /** 同じページにマッチする他のメモのURLパターン */
  existingPatterns?: import('@/types').UrlPattern[];
}

/**
 * 個別メモコンポーネント
 */
export function Memo({ memo, settings, onUpdate, onDelete, isActivated = false, onStartElementPicker, shouldOpenSettings, onSettingsOpened, onPauseActivation, onResumeActivation, existingPatterns = [] }: MemoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // アニメーション状態: enter=出現, idle=通常, shrink=最小化中, expand=展開中, exit=削除中
  const [animationState, setAnimationState] = useState<'enter' | 'idle' | 'shrink' | 'expand' | 'exit'>('enter');
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  // imageId → blob URL のマップ。画像をstateに持つことで
  // parsedContent HTML にURLを直接埋め込み、imperativeなDOM操作を排除する
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const prevMinimizedRef = useRef(memo.minimized);
  // アンマウント時のblob URL解放用
  const objectUrlsRef = useRef<Map<string, string>>(new Map());

  // memo.content が変わったとき（画像追加・削除・編集完了）に
  // 必要な画像をIndexedDBから読み込み、不要なblob URLをrevokeする
  useEffect(() => {
    if (isEditing) return;

    const currentIds = extractImageIds(memo.content ?? '');
    const cache = objectUrlsRef.current;

    // コンテンツから消えた画像のblob URLをrevoke
    const removedIds = [...cache.keys()].filter((id) => !currentIds.includes(id));
    for (const id of removedIds) {
      URL.revokeObjectURL(cache.get(id)!);
      cache.delete(id);
    }

    if (currentIds.length === 0) {
      if (cache.size > 0) setImageUrls(new Map());
      return;
    }

    // 未ロードの画像だけIndexedDBから取得
    const unloaded = currentIds.filter((id) => !cache.has(id));
    if (unloaded.length === 0) {
      // すでに全部キャッシュ済み → stateを同期するだけ
      setImageUrls(new Map(cache));
      return;
    }

    let cancelled = false;
    const loadImages = async () => {
      for (const id of unloaded) {
        if (cancelled) break;
        const blob = await getImage(id);
        if (cancelled || !blob) continue;
        const url = URL.createObjectURL(blob);
        cache.set(id, url);
      }
      if (!cancelled) setImageUrls(new Map(cache));
    };
    loadImages();
    return () => { cancelled = true; };
  }, [memo.content, isEditing]);

  // アンマウント時にすべてのblob URLを解放
  useEffect(() => {
    const cache = objectUrlsRef.current;
    return () => {
      cache.forEach((u) => URL.revokeObjectURL(u));
      cache.clear();
    };
  }, []);

  // Markdownをパース。imageUrlsにblob URLを直接埋め込むことで
  // dangerouslySetInnerHTMLのHTMLに画像srcが含まれた状態を維持する
  // → ドラッグ・リサイズ・再レンダリング時に画像が消えない
  const parsedContent = useMemo(() => {
    if (!memo.content) return '';
    const renderer = new Renderer();
    renderer.link = ({ href, title, text }) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    };
    renderer.image = ({ href, title, text }) => {
      if (href && href.startsWith(MEMO_IMG_PROTOCOL)) {
        const id = href.slice(MEMO_IMG_PROTOCOL.length);
        const titleAttr = title ? ` title="${title}"` : '';
        const url = imageUrls.get(id);
        if (url) {
          // blob URL埋め込み済み → srcが常にHTMLに含まれる
          return `<img src="${url}" data-memo-img="${id}"${titleAttr} alt="${text}" style="max-width:100%;border-radius:4px;cursor:pointer;" />`;
        }
        // ロード中
        return `<img data-memo-img="${id}"${titleAttr} alt="${text}" data-loading="true" />`;
      }
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${href}"${titleAttr} alt="${text}" style="max-width:100%;border-radius:4px;" />`;
    };
    return marked(memo.content, {
      renderer,
      gfm: true,
      breaks: true,
    }) as string;
  }, [memo.content, imageUrls]);

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


  // ライトボックス: ESCキーで閉じる
  useEffect(() => {
    if (!lightboxSrc) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxSrc(null);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [lightboxSrc]);



  // アクティブ化の一時停止制御（設定中）
  useEffect(() => {
    if (isSettingsOpen) {
      onPauseActivation?.('settings');
    } else {
      onResumeActivation?.('settings');
    }
  }, [isSettingsOpen, onPauseActivation, onResumeActivation]);

  // アクティブ化の一時停止制御（編集中）
  // IME入力中などにメモが消えないようにする
  useEffect(() => {
    if (isEditing) {
      onPauseActivation?.('editing');
    } else {
      onResumeActivation?.('editing');
    }
  }, [isEditing, onPauseActivation, onResumeActivation]);

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

  // アクティブ化メモかどうか、および周辺モードかどうか
  const isNearElementMode = isActivated && memo.activation?.positionMode === 'near-element';

  // ドラッグ機能（アクティブ化の周辺モードでは無効化）
  const { position: dragPosition, handleMouseDown: originalHandleDragStart, isDragging } = useDraggable({
    initialPosition: { x: position.x, y: position.y },
    onPositionChange: (newPos) => {
      updatePosition({ x: newPos.x, y: newPos.y });
    },
    disabled: isEditing || isNearElementMode,
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
      case 'enter':
        return memo.minimized ? 'pageminder-animate-minimize-enter' : 'pageminder-animate-enter';
      case 'expand':
        return 'pageminder-animate-expand';
      case 'shrink':
        return 'pageminder-animate-shrink';
      case 'exit':
        return 'pageminder-animate-delete';
      default:
        return '';
    }
  };

  const baseStyle = {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  if (memo.minimized) {
    const isActivationMinimized = isActivated && isNearElementMode;

    // ラベルモード: アイコン + タイトルのワイドビュー
    if (memo.labelMode) {
      const labelTitle = memo.title ?? 'メモ';
      return (
        <div
          ref={containerRef}
          className={getAnimationClass()}
          style={{
            ...baseStyle,
            position: isActivationMinimized ? 'relative' : 'fixed',
            left: isActivationMinimized ? undefined : `${dragPosition.x}px`,
            top: isActivationMinimized ? undefined : `${dragPosition.y - 8}px`,
            zIndex: 999999,
            cursor: 'pointer',
          }}
          onClick={toggleMinimize}
          onMouseDown={isActivationMinimized ? undefined : handleDragStart}
          title={labelTitle}
        >
          <div
            style={{
              backgroundColor: memoBgColor,
              color: memoTextColor,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px 6px 8px',
              maxWidth: '200px',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.22)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            <IconStickyNote size={16} color={memoTextColor} />
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '140px',
            }}>
              {labelTitle}
            </span>
          </div>
        </div>
      );
    }

    // 通常の最小化ビュー（アイコンのみ）
    return (
      <div
        ref={containerRef}
        className={getAnimationClass()}
        style={{
          ...baseStyle,
          position: isActivationMinimized ? 'relative' : 'fixed',
          left: isActivationMinimized ? undefined : `${dragPosition.x - 8}px`,
          top: isActivationMinimized ? undefined : `${dragPosition.y - 8}px`,
          width: `${MINIMIZED_SIZE.width + 16}px`,
          height: `${MINIMIZED_SIZE.height + 16}px`,
          zIndex: 999999,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: isDragging ? 'auto' : 'auto',
        }}
        onClick={toggleMinimize}
        onMouseDown={isActivationMinimized ? undefined : handleDragStart}
        title={memo.title ?? 'メモ'}
      >
        <div
          style={{
            width: `${MINIMIZED_SIZE.width}px`,
            height: `${MINIMIZED_SIZE.height}px`,
            backgroundColor: memoBgColor,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease',
            transform: 'scale(1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <IconStickyNote size={18} color={memoTextColor} />
        </div>
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
          // アクティブ化周辺モードでは相対位置（ActivationOverlayが位置管理）
          position: isNearElementMode ? 'relative' : (position.pinned ? 'absolute' : 'fixed'),
          left: isNearElementMode ? undefined : `${dragPosition.x}px`,
          top: isNearElementMode ? undefined : `${dragPosition.y}px`,
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
            cursor: isNearElementMode ? 'default' : 'move',
            userSelect: 'none',
            minWidth: 0,
            // 最小化アイコンのhoverでimperativeに付いたscaleをリセット
            transform: 'none',
          }}
          onMouseDown={isNearElementMode ? undefined : handleDragStart}
        >
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, fontSize: '12px' }}>
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
              flexShrink: 0,
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
            // 編集中は親（ActivationOverlay）への伝播を止めて、textarea操作を可能にする
            if (isEditing) {
              e.stopPropagation();
              return;
            }
            // リンクをクリックした場合はドラッグを開始しない
            const target = e.target as HTMLElement;
            if (target.tagName === 'A' || target.closest('a')) {
              return; // リンククリック時はドラッグ処理をスキップ
            }
            handleDragStart(e);
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
              ref={contentAreaRef}
              data-memo-id={memo.id}
              style={{ 
                flex: 1,
                fontSize: `${fontSize}px`,
                overflow: 'auto',
              }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                // 画像クリック → ライトボックス
                if (target.tagName === 'IMG' && target.hasAttribute('data-memo-img')) {
                  e.preventDefault();
                  e.stopPropagation();
                  const src = (target as HTMLImageElement).src;
                  if (src) setLightboxSrc(src);
                  return;
                }
                // リンククリック処理
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
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <span style={{ opacity: 0.6, display: 'block', textAlign: 'center', marginTop: '20px' }}>ダブルクリックで編集</span>
              )}
            </div>
          )}
        </div>

        {/* ツールバー（ドラッグ可能：周辺モード以外） */}
        <div
          style={{ cursor: isNearElementMode ? 'default' : 'move' }}
          onMouseDown={isNearElementMode ? undefined : handleDragStart}
        >
          <MemoToolbar
            memo={memo}
            settings={settings}
            isPinned={position.pinned}
            onTogglePin={togglePin}
            onToggleLabelMode={() => onUpdate({ ...memo, labelMode: !memo.labelMode })}
            onDelete={() => setIsDeleteDialogOpen(true)}
            onColorChange={(color) => onUpdate({ ...memo, backgroundColor: color })}
            onFontSizeChange={(size) => onUpdate({ ...memo, fontSize: size })}
            onOpenSettings={() => setIsSettingsOpen(true)}
            hidePinButton={isNearElementMode}
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
          existingPatterns={existingPatterns}
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

      {/* ライトボックス */}
      {lightboxSrc && (
        <div
          className="pageminder-lightbox"
          onClick={() => setLightboxSrc(null)}
        >
          <img src={lightboxSrc} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}
    </>
  );
}
