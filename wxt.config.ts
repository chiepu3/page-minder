import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'PageMinder',
    description: '業務メモを画面上に表示する拡張機能',
    version: '0.1.0',
    permissions: ['storage', 'activeTab', 'scripting', 'contextMenus'],
    optional_permissions: ['history', 'webNavigation'],
    host_permissions: ['<all_urls>'],
  },
});
