// =============================================================================
// PageMinder - Memo Container Component
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Memo as MemoType, Message } from '@/types';
import { Memo } from './Memo';
import { storage } from '@/lib/storage';
import { matchAnyUrlPattern } from '@/lib/url-matcher';
import { logger } from '@/lib/logger';

/**
 * メモコンテナ - 現在のURLにマッチするメモを表示
 */
export function MemoContainer() {
  const [memos, setMemos] = useState<MemoType[]>([]);
  const [loading, setLoading] = useState(true);

  // 初回ロード
  useEffect(() => {
    loadMemos();
  }, []);

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
        // 現在のURLにマッチするか確認
        if (matchAnyUrlPattern(window.location.href, newMemo.urlPatterns)) {
          setMemos((prev) => [...prev, newMemo]);
          logger.info('Memo added via message', { memoId: newMemo.id });
        }
        sendResponse({ success: true });
      }

      if (message.action === 'SCROLL_TO_MEMO') {
        const { memoId } = message.payload as { memoId: string };
        // メモを探してその位置までスクロール
        const targetMemo = memos.find(m => m.id === memoId);
        if (targetMemo) {
          const patternId = targetMemo.urlPatterns[0]?.id ?? 'default';
          const pos = targetMemo.positions[patternId];
          if (pos) {
            // pinnedならそのまま、fixedならスクロール位置を考慮
            const scrollX = pos.pinned ? pos.x - window.innerWidth / 2 : 0;
            const scrollY = pos.pinned ? pos.y - window.innerHeight / 2 : 0;
            window.scrollTo({
              left: Math.max(0, scrollX),
              top: Math.max(0, scrollY),
              behavior: 'smooth'
            });
            logger.info('Scrolled to memo', { memoId, x: pos.x, y: pos.y });
          }
        }
        sendResponse({ success: true });
      }

      // メモを左上に移動（呼び出し）
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
              pinned: false, // fixedにして画面左上に表示
            },
          };
          const updatedMemo = { ...targetMemo, positions: newPositions, minimized: false };
          storage.saveMemo(updatedMemo);
          setMemos((prev) => prev.map((m) => (m.id === memoId ? updatedMemo : m)));
          logger.info('Memo moved to visible', { memoId });
        }
        sendResponse({ success: true });
      }

      return true; // 非同期レスポンスを示す
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [memos]); // memosを依存配列に追加

  const loadMemos = async () => {
    try {
      const allMemos = await storage.getMemos();
      const currentUrl = window.location.href;
      
      // 現在のURLにマッチするメモをフィルタリング
      const matchingMemos = allMemos.filter((memo) =>
        matchAnyUrlPattern(currentUrl, memo.urlPatterns)
      );
      
      setMemos(matchingMemos);
      logger.debug('Memos loaded', { count: matchingMemos.length, url: currentUrl });
    } catch (error) {
      logger.error('Failed to load memos', { error: String(error) });
    } finally {
      setLoading(false);
    }
  };

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
          onUpdate={handleMemoUpdate}
          onDelete={handleMemoDelete}
        />
      ))}
    </div>
  );
}
