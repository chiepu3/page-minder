// =============================================================================
// PageMinder - Memo Container Component
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Memo as MemoType, Message } from '@/types';
import { Memo } from './Memo';
import { storage } from '@/lib/storage';
import { matchAnyUrlPattern } from '@/lib/url-matcher';
import { logger } from '@/lib/logger';
import { useUrlWatcher } from '@/hooks/useUrlWatcher';

import { DEFAULT_SETTINGS } from '@/lib/constants';

/**
 * メモコンテナ - 現在のURLにマッチするメモを表示
 */
export function MemoContainer() {
  const [memos, setMemos] = useState<MemoType[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return null;
  }

  return (
    <div className="pageminder-container">
      {memos.map((memo) => (
        <Memo
          key={memo.id}
          memo={memo}
          settings={settings}
          onUpdate={handleMemoUpdate}
          onDelete={handleMemoDelete}
        />
      ))}
    </div>
  );
}
