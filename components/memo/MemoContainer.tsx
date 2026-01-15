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
        // メモの位置までスクロール（将来的に実装）
        logger.debug('Scroll to memo requested', { memoId });
        sendResponse({ success: true });
      }

      return true; // 非同期レスポンスを示す
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

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
