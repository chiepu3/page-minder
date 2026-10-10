# WXT拡張API型の確認

## 原因

WXT 0.20では `wxt/browser` の `browser` と `Browser` 名前空間を利用できます。このプロジェクトのbackgroundには既に `browser` が使われていましたが、popup・storage・メッセージリスナー等に `chrome` グローバルの参照が残っていました。

`wxt prepare` を実行しても `chrome` グローバルの型は生成されません。mainのcommit `975474a862f5355008584ae24cabd938638feff0` は、正規の依存導入とprepare後でも `npm run compile` が24エラーで失敗しました。実行環境へのChrome接続不足ではなく、利用するAPIと型宣言の不一致です。

## 修正

- 既存の参照を `import { browser } from 'wxt/browser'` に統一。
- メッセージ送信元の型に `Browser.runtime.MessageSender` を利用。
- storageから読む既存の孤立画像IDリストは、キーに対応する `string[]` の型引数を指定。
- 新しい依存・独自のchrome型宣言・anyによる回避を追加しない。
- tsconfig、strict設定、manifest権限、バージョン、package-lockを変更しない。

インストール済みのWXT 0.20.13 / @wxt-dev/browser 0.1.32を使用しました。型の修正は既存の保存データを実行時に検証する仕組みではありません。

## 検証

```sh
npm ci --ignore-scripts
npx wxt prepare
npm run compile
npm test -- --run
npm run build
```

- 修正後の型チェック: エラー0。
- 全体72テスト成功。main既存69件＋API参照の互換3件。
- Chrome MV3ビルド成功。
- manifestの権限・host権限・バージョンが変更前と一致。

`tests/unit/browser-api.test.ts` は実際の `wxt/browser` を隔離Nodeプロセスでimportし、Chromeでは元のChrome APIオブジェクトをそのまま使うこと、拡張でないbrowserグローバルを採用しないこと、正規browser APIがある場合の選択を検証します。実ブラウザAPIやユーザーデータには接続しません。実Chrome/FirefoxでのE2E動作確認ではありません。

この変更は共有トリガー修正PRとは独立したmain基準です。共有トリガーの7テストを取り込んだという意味ではありません。

## 公式資料

- [WXT: Extension APIs](https://wxt.dev/guide/essentials/extension-apis)
- [WXT: Upgrading WXT / Extension API Type Changes](https://wxt.dev/guide/resources/upgrading)
