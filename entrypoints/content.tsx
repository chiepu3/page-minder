// =============================================================================
// PageMinder - Content Script Entry Point
// =============================================================================

import ReactDOM from 'react-dom/client';
import { MemoContainer } from '@/components/memo/MemoContainer';
import { logger } from '@/lib/logger';
import { SHADOW_ROOT_NAME } from '@/lib/constants';
import '@/styles/content.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    logger.info('PageMinder content script loaded', { url: window.location.href });

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
