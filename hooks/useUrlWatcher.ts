// =============================================================================
// PageMinder - URL Watcher Hook for SPA Support  
// =============================================================================
// 
// Content Scriptは「isolated world」で動作するため、history.pushStateの
// 直接オーバーライドはできない。代わりに以下を組み合わせる：
// 1. MutationObserverでDOM変更を監視し、URLの変化をポーリング
// 2. popstate/hashchangeイベントを監視
// 3. ページコンテキストにスクリプトを注入してカスタムイベントを発火

import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

// URL変更チェック間隔（ms）
const URL_CHECK_INTERVAL = 100;

/**
 * SPA対応のためのURL変更検知フック
 */
export function useUrlWatcher(onUrlChange: (newUrl: string) => void) {
    const currentUrlRef = useRef(window.location.href);
    const onUrlChangeRef = useRef(onUrlChange);

    // コールバックの最新版を保持
    useEffect(() => {
        onUrlChangeRef.current = onUrlChange;
    }, [onUrlChange]);

    // URL変更をチェックして通知
    const checkUrlChange = useCallback(() => {
        const newUrl = window.location.href;
        if (newUrl !== currentUrlRef.current) {
            logger.info('URL changed detected', {
                from: currentUrlRef.current,
                to: newUrl
            });
            currentUrlRef.current = newUrl;
            onUrlChangeRef.current(newUrl);
        }
    }, []);

    useEffect(() => {
        // 1. popstate イベント監視（ブラウザの戻る/進む）
        const handlePopState = () => {
            logger.debug('popstate event detected');
            checkUrlChange();
        };

        // 2. hashchange イベント監視
        const handleHashChange = () => {
            logger.debug('hashchange event detected');
            checkUrlChange();
        };

        // 3. MutationObserverでDOM変更を監視（URLポーリング）
        // SPAはDOM変更時にURLも変わることが多い
        let lastCheckTime = Date.now();
        const observer = new MutationObserver(() => {
            const now = Date.now();
            // 負荷軽減のため、一定間隔でのみチェック
            if (now - lastCheckTime >= URL_CHECK_INTERVAL) {
                lastCheckTime = now;
                checkUrlChange();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // 4. ページコンテキストにスクリプトを注入して
        //    history.pushState/replaceStateの呼び出しを検知
        const script = document.createElement('script');
        script.textContent = `
      (function() {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function() {
          const result = originalPushState.apply(this, arguments);
          window.dispatchEvent(new CustomEvent('pageminder:urlchange', { detail: { type: 'pushState' } }));
          return result;
        };
        
        history.replaceState = function() {
          const result = originalReplaceState.apply(this, arguments);
          window.dispatchEvent(new CustomEvent('pageminder:urlchange', { detail: { type: 'replaceState' } }));
          return result;
        };
      })();
    `;
        document.documentElement.appendChild(script);
        script.remove();

        // カスタムイベントをリスン
        const handleCustomUrlChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            logger.debug('pageminder:urlchange event detected', detail);
            // 少し遅延させてURLの更新を待つ
            setTimeout(checkUrlChange, 0);
        };

        // イベントリスナー登録
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('hashchange', handleHashChange);
        window.addEventListener('pageminder:urlchange', handleCustomUrlChange);

        logger.info('URL watcher initialized (enhanced)', { initialUrl: currentUrlRef.current });

        // クリーンアップ
        return () => {
            observer.disconnect();
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('hashchange', handleHashChange);
            window.removeEventListener('pageminder:urlchange', handleCustomUrlChange);
            logger.debug('URL watcher cleaned up');
        };
    }, [checkUrlChange]);
}
