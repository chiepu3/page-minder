import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'PageMinder',
    description: '業務メモを画面上に表示する拡張機能',
    version: '0.1.0',
    permissions: ['storage', 'activeTab', 'scripting', 'contextMenus', 'webNavigation'],
    optional_permissions: ['history'],
    host_permissions: ['<all_urls>'],
  },
  vite: () => ({
    build: {
      // Chrome拡張機能ではUTF-8以外の文字がエラーになる
      // 非ASCII文字をエスケープシーケンスに変換
      target: 'esnext',
      rollupOptions: {
        output: {
          // 生成されるJSで非ASCII文字をエスケープ
          generatedCode: {
            constBindings: true,
          },
        },
      },
    },
    esbuild: {
      // 非ASCII文字をUnicodeエスケープシーケンスに変換
      charset: 'ascii',
    },
  }),
});
