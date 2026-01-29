// =============================================================================
// PageMinder - Background Script
// =============================================================================

import type { Memo } from '@/types';
import { storage } from '@/lib/storage';
import { matchAnyUrlPattern } from '@/lib/url-matcher';
import { DEFAULT_SETTINGS, DEFAULT_MEMO_SIZE } from '@/lib/constants';

const CONTEXT_MENU_ID = 'pageminder-create-memo';
const CONTEXT_MENU_ACTIVATION_ID = 'pageminder-create-activation-memo';

// ==========================================================================
// Badge Update Logic
// ==========================================================================

/**
 * 指定したタブのバッジを更新
 * @param tabId - タブID
 * @param url - タブのURL
 */
async function updateBadgeForTab(tabId: number, url: string): Promise<void> {
  try {
    const memos = await storage.getMemos();
    const matchingMemos = memos.filter(memo => matchAnyUrlPattern(url, memo.urlPatterns));
    const count = matchingMemos.length;

    if (count > 0) {
      await browser.action.setBadgeText({ tabId, text: String(count) });
      await browser.action.setBadgeBackgroundColor({ tabId, color: '#7c3aed' }); // Purple color
    } else {
      await browser.action.setBadgeText({ tabId, text: '' });
    }
  } catch (error) {
    console.debug('Failed to update badge:', error);
  }
}

/**
 * 現在アクティブなタブのバッジを更新
 */
async function updateBadgeForActiveTab(): Promise<void> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab?.url) {
      await updateBadgeForTab(tab.id, tab.url);
    }
  } catch (error) {
    console.debug('Failed to update badge for active tab:', error);
  }
}

export default defineBackground(() => {
  console.log('PageMinder background script loaded', { id: browser.runtime.id });

  // ==========================================================================
  // SPA対応: URL変更検知
  // ==========================================================================

  // History API による遷移を検知 (pushState/replaceState)
  browser.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
    // メインフレームのみ対象
    if (details.frameId !== 0) return;

    console.log('SPA navigation detected (historyStateUpdated)', {
      tabId: details.tabId,
      url: details.url
    });

    try {
      await browser.tabs.sendMessage(details.tabId, {
        action: 'URL_CHANGED',
        payload: { url: details.url },
      });
    } catch (error) {
      // Content scriptがまだロードされていない場合は無視
      console.debug('Failed to notify content script of URL change:', error);
    }

    // バッジを更新
    await updateBadgeForTab(details.tabId, details.url);
  });

  // ハッシュフラグメント変更を検知
  browser.webNavigation.onReferenceFragmentUpdated.addListener(async (details) => {
    if (details.frameId !== 0) return;

    console.log('SPA navigation detected (referenceFragmentUpdated)', {
      tabId: details.tabId,
      url: details.url
    });

    try {
      await browser.tabs.sendMessage(details.tabId, {
        action: 'URL_CHANGED',
        payload: { url: details.url },
      });
    } catch (error) {
      console.debug('Failed to notify content script of URL change:', error);
    }

    // バッジを更新
    await updateBadgeForTab(details.tabId, details.url);
  });

  // ==========================================================================
  // バッジ更新イベント
  // ==========================================================================

  // タブがアクティブになった時
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await browser.tabs.get(activeInfo.tabId);
      if (tab.url) {
        await updateBadgeForTab(activeInfo.tabId, tab.url);
      }
    } catch (error) {
      console.debug('Failed to update badge on tab activation:', error);
    }
  });

  // タブのURLが変更された時（通常のナビゲーション）
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // URLが変更された場合のみ
    if (changeInfo.url && tab.url) {
      await updateBadgeForTab(tabId, tab.url);
    }
  });

  // ストレージが変更された時（メモの追加・削除・更新）
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'local' && changes.memos) {
      // 現在アクティブなタブのバッジを更新
      await updateBadgeForActiveTab();
    }
  });

  // ==========================================================================
  // コンテキストメニュー
  // ==========================================================================

  const OPTIONS_MENU_ID = 'pageminder-open-options';

  // コンテキストメニューを登録
  browser.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'PageMinder: メモを作成',
    contexts: ['page', 'selection'],
  });

  // アクティブ化メモ作成用のコンテキストメニュー（要素右クリック時）
  browser.contextMenus.create({
    id: CONTEXT_MENU_ACTIVATION_ID,
    title: 'PageMinder: この要素でメモを表示',
    contexts: ['page', 'image', 'link', 'video', 'audio'],
  });

  // 拡張機能アイコン右クリック時の設定メニュー
  browser.contextMenus.create({
    id: OPTIONS_MENU_ID,
    title: '設定を開く',
    contexts: ['action'],  // 拡張機能アイコン右クリック時のみ
  });


  // コンテキストメニュークリック時の処理
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    // 設定を開く
    if (info.menuItemId === OPTIONS_MENU_ID) {
      browser.runtime.openOptionsPage();
      return;
    }

    // メモを作成
    if (info.menuItemId === CONTEXT_MENU_ID && tab?.id && tab?.url) {
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
    }

    // アクティブ化メモを作成（右クリックした要素をトリガーに）
    if (info.menuItemId === CONTEXT_MENU_ACTIVATION_ID && tab?.id && tab?.url) {
      try {
        // Content Scriptにセレクタ取得を依頼
        const response = await browser.tabs.sendMessage(tab.id, {
          action: 'GET_CLICKED_ELEMENT_SELECTOR',
        }) as { selector?: string; success: boolean };

        if (!response?.selector) {
          console.warn('Failed to get clicked element selector');
          return;
        }

        const selector = response.selector;
        console.log('Creating activation memo with selector:', selector);

        // 設定を取得
        const settings = await storage.getSettings();

        const patternId = crypto.randomUUID();
        const newMemo: Memo = {
          id: crypto.randomUUID(),
          content: '',
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
          // アクティブ化設定を追加
          activation: {
            enabled: true,
            trigger: 'hover',
            selector: selector,
            delay: 300,
            positionMode: 'near-element',
            offsetX: 10,
            offsetY: 10,
            highlightElement: true,
            highlightColor: 'rgba(255, 193, 7, 0.3)',
            hideCondition: 'trigger-end',
            hideDelay: 5000,
            clickStopPropagation: true,
          },
        };

        // ストレージに保存
        await storage.saveMemo(newMemo);

        // Content Scriptにメモ作成を通知（設定モーダルを自動で開く）
        await browser.tabs.sendMessage(tab.id, {
          action: 'CREATE_MEMO_WITH_SETTINGS',
          payload: newMemo,
        });

        console.log('Activation memo created from context menu', { memoId: newMemo.id, selector });
      } catch (error) {
        console.error('Failed to create activation memo from context menu:', error);
      }
    }
  });
});
