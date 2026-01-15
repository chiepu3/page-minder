// =============================================================================
// PageMinder - Background Script
// =============================================================================

import type { Memo } from '@/types';
import { storage } from '@/lib/storage';
import { DEFAULT_SETTINGS, DEFAULT_MEMO_SIZE } from '@/lib/constants';

const CONTEXT_MENU_ID = 'pageminder-create-memo';

export default defineBackground(() => {
  console.log('PageMinder background script loaded', { id: browser.runtime.id });

  // コンテキストメニューを登録
  browser.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'PageMinder: メモを作成',
    contexts: ['page', 'selection'],
  });

  // コンテキストメニュークリック時の処理
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id || !tab?.url) {
      return;
    }

    try {
      // 設定を取得
      const settings = await storage.getSettings();

      // 選択テキストがあればメモの初期内容として使用
      const selectedText = info.selectionText || '';

      const patternId = crypto.randomUUID();
      const newMemo: Memo = {
        id: crypto.randomUUID(),
        content: selectedText,
        urlPatterns: [{
          id: patternId,
          type: 'wildcard',
          pattern: tab.url,
          description: '現在のページ',
        }],
        positions: {
          [patternId]: {
            x: 100,
            y: 100,
            width: DEFAULT_MEMO_SIZE.width,
            height: DEFAULT_MEMO_SIZE.height,
            pinned: false,
          },
        },
        minimized: false,
        backgroundColor: settings.defaultBackgroundColor || DEFAULT_SETTINGS.defaultBackgroundColor,
        textColor: settings.defaultTextColor || DEFAULT_SETTINGS.defaultTextColor,
        fontSize: settings.defaultFontSize || DEFAULT_SETTINGS.defaultFontSize,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // ストレージに保存
      await storage.saveMemo(newMemo);

      // Content Scriptにメモ作成を通知
      await browser.tabs.sendMessage(tab.id, {
        action: 'CREATE_MEMO',
        payload: newMemo,
      });

      console.log('Memo created from context menu', { memoId: newMemo.id, hasSelection: !!selectedText });
    } catch (error) {
      console.error('Failed to create memo from context menu:', error);
    }
  });
});
