// =============================================================================
// PageMinder - Memo Container Component
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Memo as MemoType, Message } from '@/types';
import { Memo } from './Memo';
import { ElementPicker } from './ElementPicker';
import { ActivationOverlay } from './ActivationOverlay';
import { storage } from '@/lib/storage';
import { matchAnyUrlPattern } from '@/lib/url-matcher';
import { logger } from '@/lib/logger';
import { useUrlWatcher } from '@/hooks/useUrlWatcher';
import { useActivation } from '@/hooks/useActivation';

import { DEFAULT_SETTINGS } from '@/lib/constants';

/**
 * メモコンテナ - 現在のURLにマッチするメモを表示
 */
export function MemoContainer() {
  const [memos, setMemos] = useState<MemoType[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showElementPicker, setShowElementPicker] = useState(false);
  const [pickerTargetMemoId, setPickerTargetMemoId] = useState<string | null>(null);
  const [reopenSettingsForMemoId, setReopenSettingsForMemoId] = useState<string | null>(null);

  // アクティブ化状態管理
  const [activatedMemos, setActivatedMemos] = useState<Map<string, Element>>(new Map());

  const { deactivateMemo, pauseDeactivation, resumeDeactivation } = useActivation(memos, {
    onActivate: (memoId, triggerElement) => {
      setActivatedMemos(prev => new Map(prev).set(memoId, triggerElement));
    },
    onDeactivate: (memoId) => {
      setActivatedMemos(prev => {
        const next = new Map(prev);
        next.delete(memoId);
        return next;
      });
    },
    settings,
  });

  // メモ読み込み関数（URL変更時にも呼ばれる）
  const loadMemos = useCallback(async () => {
    try {
      const allMemos = await storage.getMemos();
      const currentUrl = window.location.href;
      const matchingMemos = allMemos.filter((memo) =>
        matchAnyUrlPattern(currentUrl, memo.urlPatterns)
      );
      logger.info('Memos loaded for URL', { url: currentUrl, count: matchingMemos.length });
      setMemos(matchingMemos);
    } catch (error) {
      logger.error('Failed to load memos', { error: String(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  // SPA対応: URL変更を検知してメモを再評価
  useUrlWatcher(useCallback((newUrl: string) => {
    logger.info('URL changed, reloading memos', { newUrl });
    loadMemos();
  }, [loadMemos]));

  // 初回ロード
  useEffect(() => {
    loadMemos();
    loadSettings();
  }, [loadMemos]);

  const loadSettings = async () => {
    try {
      const globalSettings = await storage.getSettings();
      setSettings(globalSettings);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  // メッセージリスナー（Popupからの通知を受信）
  useEffect(() => {
    const handleMessage = (
      message: Message,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: unknown) => void
    ) => {
      logger.debug('Message received', { action: message.action });

      if (message.action === 'CREATE_MEMO') {
        const newMemo = message.payload as MemoType;
        if (matchAnyUrlPattern(window.location.href, newMemo.urlPatterns)) {
          setMemos((prev) => [...prev, newMemo]);
        }
        sendResponse({ success: true });
      }

      if (message.action === 'SCROLL_TO_MEMO') {
        const { memoId } = message.payload as { memoId: string };
        const targetMemo = memos.find(m => m.id === memoId);
        if (targetMemo) {
          const patternId = targetMemo.urlPatterns[0]?.id ?? 'default';
          const pos = targetMemo.positions[patternId];
          if (pos) {
            const scrollX = pos.pinned ? pos.x - window.innerWidth / 2 : 0;
            const scrollY = pos.pinned ? pos.y - window.innerHeight / 2 : 0;
            window.scrollTo({
              left: Math.max(0, scrollX),
              top: Math.max(0, scrollY),
              behavior: 'smooth'
            });
          }
        }
        sendResponse({ success: true });
      }

      if (message.action === 'MOVE_MEMO_TO_VISIBLE') {
        const { memoId } = message.payload as { memoId: string };
        const targetMemo = memos.find(m => m.id === memoId);
        if (targetMemo) {
          const patternId = targetMemo.urlPatterns[0]?.id ?? 'default';
          const newPositions = {
            ...targetMemo.positions,
            [patternId]: {
              ...targetMemo.positions[patternId],
              x: 50,
              y: 50,
              pinned: false,
            },
          };
          const updatedMemo = { ...targetMemo, positions: newPositions, minimized: false };
          storage.saveMemo(updatedMemo);
          setMemos((prev) => prev.map((m) => (m.id === memoId ? updatedMemo : m)));
        }
        sendResponse({ success: true });
      }

      // ポップアップからの削除通知
      if (message.action === 'DELETE_MEMO') {
        const { memoId } = message.payload as { memoId: string };
        setMemos((prev) => prev.filter((m) => m.id !== memoId));
        sendResponse({ success: true });
      }

      // 設定更新通知（テーマ切り替えなど）
      if (message.action === 'SAVE_SETTINGS') {
        setSettings(message.payload as any);
        sendResponse({ success: true });
      }

      // SPA対応: URL変更通知（background scriptから）
      if (message.action === 'URL_CHANGED') {
        const { url } = message.payload as { url: string };
        logger.info('URL changed (SPA navigation)', { url });
        loadMemos();
        sendResponse({ success: true });
      }

      // ポップアップからのメモ設定を開く通知
      if (message.action === 'OPEN_MEMO_SETTINGS') {
        const { memoId } = message.payload as { memoId: string };
        // reopenSettingsForMemoIdを設定することで、Memoコンポーネントが設定モーダルを開く
        setReopenSettingsForMemoId(memoId);
        sendResponse({ success: true });
      }

      return true;
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [memos]);




  const handleMemoUpdate = useCallback(async (updatedMemo: MemoType) => {
    await storage.saveMemo(updatedMemo);
    setMemos((prev) =>
      prev.map((m) => (m.id === updatedMemo.id ? updatedMemo : m))
    );
  }, []);

  const handleMemoDelete = useCallback(async (memoId: string) => {
    await storage.deleteMemo(memoId);
    setMemos((prev) => prev.filter((m) => m.id !== memoId));
  }, []);

  // ElementPicker起動ハンドラ
  const handleStartElementPicker = useCallback((memoId: string) => {
    setPickerTargetMemoId(memoId);
    setShowElementPicker(true);
  }, []);

  // セレクタ選択完了ハンドラ
  const handleSelectorSelected = useCallback(async (selector: string) => {
    if (pickerTargetMemoId) {
      const targetMemo = memos.find(m => m.id === pickerTargetMemoId);
      if (targetMemo) {
        // activation設定がなければデフォルトを作成
        const currentActivation = targetMemo.activation ?? {
          enabled: true,
          trigger: 'hover' as const,
          selector: '',
          delay: 500,
          positionMode: 'near-element' as const,
          offsetX: 10,
          offsetY: 10,
          highlightElement: true,
          highlightColor: 'rgba(255, 193, 7, 0.3)',
          hideCondition: 'trigger-end' as const,
          hideDelay: 5000,
          clickStopPropagation: true,
        };
        
        const updatedMemo = {
          ...targetMemo,
          activation: { ...currentActivation, selector, enabled: true }, // enabledを明示的にtrueに
        };
        
        // 設定モーダルを再開するためのフラグを【先に】設定（メモ更新でフィルタが適用される前に）
        setReopenSettingsForMemoId(pickerTargetMemoId);
        
        await handleMemoUpdate(updatedMemo);
      }
    }
    setShowElementPicker(false);
    setPickerTargetMemoId(null);
  }, [pickerTargetMemoId, memos, handleMemoUpdate]);

  if (loading) {
    return null;
  }

  // ElementPicker表示中はピッカーのみ表示
  if (showElementPicker) {
    return (
      <ElementPicker
        onSelect={handleSelectorSelected}
        onCancel={() => {
          setShowElementPicker(false);
          setPickerTargetMemoId(null);
        }}
      />
    );
  }

  return (
    <div className="pageminder-container">
      {/* 通常のメモ表示（アクティブ化されていないもの、または設定中のもの） */}
      {memos.filter(memo => {
        // アクティブ化が無効なら表示
        if (!memo.activation?.enabled) return true;
        // 設定作業中なら表示（アクティブ化設定直後の編集のため）
        if (reopenSettingsForMemoId === memo.id) return true;
        // それ以外（アクティブ化有効かつ設定中でない）は非表示
        return false;
      }).map((memo) => (
        <Memo
          key={memo.id}
          memo={memo}
          settings={settings}
          onUpdate={handleMemoUpdate}
          onDelete={handleMemoDelete}
          onStartElementPicker={() => {
            setPickerTargetMemoId(memo.id);
            setShowElementPicker(true);
          }}
          shouldOpenSettings={reopenSettingsForMemoId === memo.id}
          onSettingsOpened={() => setReopenSettingsForMemoId(null)}
          onPauseActivation={(reason) => pauseDeactivation(memo.id, reason)}
          onResumeActivation={(reason) => resumeDeactivation(memo.id, reason)}
        />
      ))}

      {/* アクティブ化されたメモのオーバーレイ表示 */}
      {Array.from(activatedMemos.entries()).map(([memoId, triggerElement]) => {
        const memo = memos.find(m => m.id === memoId);
        if (!memo) return null;
        return (
          <ActivationOverlay
            key={`activated-${memoId}`}
            memo={memo}
            triggerElement={triggerElement}
            settings={settings}
            onUpdate={handleMemoUpdate}
            onDelete={handleMemoDelete}
            onStartElementPicker={handleStartElementPicker}
            onPauseActivation={(reason) => pauseDeactivation(memo.id, reason)}
            onResumeActivation={(reason) => resumeDeactivation(memo.id, reason)}
            onClose={() => deactivateMemo(memoId)}
          />
        );
      })}
    </div>
  );
}
