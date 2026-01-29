// =============================================================================
// PageMinder - Content Script Entry Point
// =============================================================================

import ReactDOM from 'react-dom/client';
import { MemoContainer } from '@/components/memo/MemoContainer';
import { logger } from '@/lib/logger';
import { SHADOW_ROOT_NAME } from '@/lib/constants';
import { generateSelector } from '@/lib/selector-generator';
import '@/styles/content.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    logger.info('PageMinder content script loaded', { url: window.location.href });

    // 右クリックした要素を追跡（コンテキストメニュー用）
    document.addEventListener('contextmenu', (e) => {
      const target = e.target as Element;
      if (target) {
        try {
          const selector = generateSelector(target);
          (window as any).__pageminder_last_clicked_selector = selector;
          logger.debug('Context menu target stored', { selector });
        } catch (err) {
          logger.warn('Failed to generate selector for context menu target', { error: String(err) });
          (window as any).__pageminder_last_clicked_selector = '';
        }
      }
    }, true);

    // Shadow DOMを使用してUIを作成
    const ui = await createShadowRootUi(ctx, {
      name: SHADOW_ROOT_NAME,
      position: 'inline',
      anchor: 'body',
      append: 'first',
      onMount: (container) => {
        // Reactアプリをマウント
        const root = ReactDOM.createRoot(container);
        root.render(<MemoContainer />);
        logger.debug('MemoContainer mounted in Shadow DOM');
        return root;
      },
      onRemove: (root) => {
        // クリーンアップ
        root?.unmount();
        logger.debug('MemoContainer unmounted');
      },
    });

    ui.mount();
  },
});
