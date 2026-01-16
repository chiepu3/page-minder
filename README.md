# PageMinder

> 業務メモを画面上に表示するChrome拡張機能

PageMinderは、ブラウザ上で動作する付箋メモ拡張機能です。特定のURLパターンにマッチするページで、任意の位置にメモを表示し、業務中のミス防止や手順の可視化をサポートします。

## 特徴

- **付箋メモ機能**: ブラウザ上の任意の位置に付箋メモを配置
- **ドラッグ＆ドロップ**: メモの位置を自由に移動
- **リサイズ対応**: メモのサイズを柔軟に変更
- **最小化機能**: 使わない時は小さなアイコンに縮小
- **URLパターンマッチング**: 特定のページでのみメモを表示
- **Markdown対応**: Markdown記法でメモを整形
- **ダークモード**: ライトモード/ダークモードの切り替え
- **ピン止め**: スクロール追従（fixed）とページ内固定（absolute）の切り替え
- **コンテキストメニュー**: 右クリックからメモを作成
- **並び替え**: ポップアップでメモの表示順を変更

## スクリーンショット

<!-- TODO: スクリーンショットを追加 -->

## インストール

### 開発者モードでのインストール

1. このリポジトリをクローン:
```bash
git clone https://github.com/chiepu3/page-minder.git
cd page-minder
```

2. 依存関係をインストール:
```bash
npm install
```

3. 拡張機能をビルド:
```bash
npm run build
```

4. Chromeで拡張機能を読み込む:
   - Chrome で `chrome://extensions/` を開く
   - 右上の「デベロッパーモード」をオンにする
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `.output/chrome-mv3` フォルダを選択

## 使い方

### メモの作成

1. ブラウザのツールバーで PageMinder アイコンをクリック
2. 「+ 新規メモを追加」ボタンをクリック
3. メモの内容を入力して保存

または、ページ上で右クリックして「メモを作成」を選択します。

### メモの編集

- メモをダブルクリックで編集モードに入る
- 編集アイコン（✏️）をクリックして編集
- `Ctrl + Enter` で保存、`Esc` でキャンセル

### メモの操作

- **移動**: メモのヘッダー部分をドラッグ
- **リサイズ**: 右下のハンドルをドラッグ
- **最小化**: 最小化ボタン（➖）をクリック
- **ピン止め**: ピンボタン（📌）でfixed/absoluteを切り替え
- **設定**: 歯車アイコン（⚙️）で設定モーダルを開く
- **削除**: ゴミ箱アイコン（🗑️）で削除

### URLパターンの設定

メモの設定モーダルで、どのページでメモを表示するかを設定できます。

- **ワイルドカード**: `https://example.com/*/workitems/*`
- **正規表現**: `^https://example\.com/web/projects/[^/]+/workitems/\d+$`

## 技術スタック

- **WXT**: 次世代のブラウザ拡張機能フレームワーク
- **React 19**: UI構築
- **TypeScript**: 型安全な開発
- **Tailwind CSS**: スタイリング
- **Vitest**: テスト
- **Manifest V3**: Chrome拡張機能の最新規格

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### テストの実行

```bash
npm test
```

### Firefoxでの開発

```bash
npm run dev:firefox
npm run build:firefox
```

## プロジェクト構造

```
page-minder/
├── components/         # Reactコンポーネント
├── entrypoints/        # 拡張機能のエントリーポイント
│   ├── background.ts   # バックグラウンドスクリプト
│   ├── content.tsx     # コンテンツスクリプト
│   └── popup/          # ポップアップUI
├── hooks/              # カスタムReactフック
├── lib/                # ユーティリティ関数
├── types/              # TypeScript型定義
├── styles/             # グローバルスタイル
├── public/             # 静的アセット
└── docs/               # ドキュメント
```

## ロードマップ

詳細は [docs/roadmap.md](docs/roadmap.md) を参照してください。

### 実装済み (v0.1.0)
- ✅ 基盤レイヤー（型定義、ストレージ、URLマッチング）
- ✅ Content Script（メモ表示、ドラッグ、リサイズ）
- ✅ Popup UI（メモ一覧、新規作成）
- ✅ メモUI改善（ピン止め、ジャンプ、設定モーダル）
- ✅ 利便性向上（コンテキストメニュー、並び替え）

### 今後の予定
- 🔄 Markdownエディタ（WYSIWYGプレビュー）
- 🔄 要素ピッカー（AdBlock風の要素選択）
- 🔄 アクティブ化機能（hover/click/focusトリガー）
- 🔄 SPA対応（URL変更検知）
- 🔄 Options Page（設定画面、インポート/エクスポート）

## 仕様書

詳細な機能仕様は [docs/specification.md](docs/specification.md) を参照してください。

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 貢献

プルリクエストは歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 作者

[@chiepu3](https://github.com/chiepu3)

## 謝辞

このプロジェクトは以下のオープンソースプロジェクトを使用しています:

- [WXT](https://wxt.dev/) - 拡張機能フレームワーク
- [React](https://react.dev/) - UIライブラリ
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク
- [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor) - Markdownエディタ
- [@botanicastudios/element-selector](https://github.com/botanicastudios/element-selector) - 要素セレクタ
