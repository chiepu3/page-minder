// =============================================================================
// PageMinder - Memo Container Component
// =============================================================================

import { useState, useEffect } from 'react';
import { Memo as MemoType } from '@/types';
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

  useEffect(() => {
    loadMemos();
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

  const handleMemoUpdate = async (updatedMemo: MemoType) => {
    await storage.saveMemo(updatedMemo);
    setMemos((prev) =>
      prev.map((m) => (m.id === updatedMemo.id ? updatedMemo : m))
    );
  };

  const handleMemoDelete = async (memoId: string) => {
    await storage.deleteMemo(memoId);
    setMemos((prev) => prev.filter((m) => m.id !== memoId));
  };

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
