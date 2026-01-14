# 業務メモ表示 Chrome拡張機能 仕様書

## 1. 概要

### 1.1 プロジェクト名
**PageMinder**

### 1.2 目的
業務中のミス防止を目的とした、ブラウザ上で動作する付箋メモ拡張機能。
特定のURLパターンにマッチするページで、任意の位置にメモを表示し、特定の要素へのホバー/クリック時に注意喚起を行う。

### 1.3 主要ユースケース
- IBM Rational Team Concert (RTC) のチケット処理時の注意事項表示
- 定型業務における入力ミス防止（ボタンクリック前の確認事項表示）
- 業務手順の可視化とリマインド

### 1.4 ターゲット環境
- Chrome ブラウザ (Manifest V3)
- 開発者モードでの自己利用（Chrome Web Store非公開）
- 企業内ネットワーク環境での使用

---

## 2. 機能要件

### 2.1 メモ表示機能

#### 2.1.1 基本表示
| 項目 | 仕様 |
|------|------|
| 表示位置 | 画面上の任意座標（X, Y）に配置可能 |
| 位置モード | Fixed（スクロール追従）/ Absolute（ページ内固定）切替可能 |
| サイズ | 幅・高さをドラッグで自由に変更可能 |
| 移動 | ドラッグ＆ドロップで画面上を移動可能 |
| オーバーフロー | Y方向にスクロール |

#### 2.1.2 メモの構成要素
```typescript
interface Memo {
  id: string;                    // UUID
  title?: string;                // タイトル（optional）
  content: string;               // 本文（Markdown対応）
  fontSize?: number;             // フォントサイズ（px）、デフォルト: 14
  backgroundColor?: string;      // 背景色（hex）、デフォルト: #FFFFA5
  textColor?: string;            // 文字色（hex）、デフォルト: #333333
  
  // 表示条件
  urlPatterns: UrlPattern[];     // 表示するページのURLパターン
  
  // 位置・サイズ（URLパターンごとに独立設定可能）
  positions: {
    [patternId: string]: {
      x: number;
      y: number;
      width: number;
      height: number;
      pinned: boolean;           // true: absolute, false: fixed
    }
  };
  
  // 状態
  minimized: boolean;            // 最小化状態
  
  // アクティブ化設定（optional）
  activation?: ActivationConfig;
  
  // メタデータ
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

#### 2.1.3 URLパターン設定
```typescript
interface UrlPattern {
  id: string;
  type: 'wildcard' | 'regex';
  pattern: string;
  description?: string;          // ユーザー向け説明
}

// ワイルドカード例
// https://rtc.example.com/web/projects/*/workitems/*
// → * は任意の文字列にマッチ

// 正規表現例
// ^https://rtc\.example\.com/web/projects/[^/]+/workitems/\d+$
```

### 2.2 アクティブ化機能（要素トリガー）

#### 2.2.1 トリガー種別
| トリガー | 説明 |
|----------|------|
| hover | 指定要素を一定時間ホバーでメモ表示 |
| click | 指定要素をクリックでメモ表示（イベントは伝播） |
| focus | 指定input要素にフォーカスでメモ表示 |
| info-icon | 指定要素の近くに i アイコンを表示、ホバー/クリックでメモ表示 |

#### 2.2.2 アクティブ化設定
```typescript
interface ActivationConfig {
  enabled: boolean;
  trigger: 'hover' | 'click' | 'focus' | 'info-icon';
  selector: string;              // CSSセレクタ
  delay?: number;                // hover時の遅延（ms）、デフォルト: 500
  
  // 表示位置
  positionMode: 'near-element' | 'fixed-position';
  offsetX?: number;              // 要素からのオフセット
  offsetY?: number;
  
  // 強調表示
  highlightElement?: boolean;    // トリガー時に要素をハイライト
  highlightColor?: string;       // ハイライト色
}
```

### 2.3 要素セレクタ機能

#### 2.3.1 ピッカーUI
- AdBlock風の要素選択インターフェース
- ホバーで要素をハイライト表示
- クリックで要素を選択
- 選択した要素のCSSセレクタを自動生成
- セレクタのプレビュー表示

#### 2.3.2 セレクタ生成ロジック
- 優先順位: ID → class → tag + nth-child
- ユニーク性を保証する最短セレクタを生成
- 複数の候補を提示し、ユーザーが選択可能

### 2.4 メモ編集機能

#### 2.4.1 編集モード
| 操作 | 動作 |
|------|------|
| ダブルクリック | 編集モードに入る |
| Ctrl + Enter | 編集を確定 |
| 保存ボタン | 編集を確定 |
| Escキー | 編集をキャンセル |

#### 2.4.2 Markdownサポート
- 見出し（#, ##, ###）
- 太字、斜体、取り消し線
- リスト（箇条書き、番号付き）
- チェックボックス
- コードブロック
- リンク
- **WYSIWYG編集**（Notion/Obsidian風ライブプレビュー）

### 2.5 メモUI詳細

#### 2.5.1 アイコンバー（メモ下部）
| アイコン | 機能 |
|----------|------|
| 📌 ピン | ピン止め切替（fixed ↔ absolute） |
| ✏️ 編集 | 編集モードに入る |
| 📋 コピー | メモ内容をクリップボードにコピー |
| 🎨 背景色 | 背景色選択パレット |
| 🔤 フォント | フォントサイズ変更 |
| 🗑️ 削除 | メモを削除（確認ダイアログ） |
| ➖ 最小化 | 正方形アイコンに縮小 |
| ⚙️ 設定 | 設定モーダルを開く |

#### 2.5.2 リサイズハンドル
- メモ右下にリサイズハンドル表示
- ドラッグでサイズ変更

#### 2.5.3 最小化状態
- 正方形のアイコンに縮小（24x24px程度）
- ドラッグ＆ドロップで移動可能
- クリックで元のサイズに復元
- ピン止め状態に準じた表示位置

### 2.6 設定モーダル

#### 2.6.1 表示するページ設定
- URLパターンの追加・編集・削除
- ワイルドカード / 正規表現の切替
- **現在のURLとのマッチングテスト**
- **履歴からマッチするURLを表示**（要: history権限）

#### 2.6.2 アクティブ化設定
- トリガー種別の選択
- 要素セレクタの設定（ピッカーUI起動）
- 遅延時間の設定
- 強調表示のON/OFF

---

## 3. ポップアップUI

### 3.1 構成要素
```
┌─────────────────────────────────────┐
│  Work Memo Overlay                  │
├─────────────────────────────────────┤
│  [+ 新規メモを追加]                  │
├─────────────────────────────────────┤
│  現在のページのメモ (3件)            │
│  ┌─────────────────────────────────┐│
│  │ 📝 チケット確認事項              ││
│  │ hover: .submit-button           ││
│  │ [ジャンプ] [⚙️]                  ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 📝 入力注意                      ││
│  │ [ジャンプ] [⚙️]                  ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  [全体設定] [インポート/エクスポート] │
└─────────────────────────────────────┘
```

### 3.2 機能詳細
| 機能 | 説明 |
|------|------|
| 新規メモ追加 | 現在のページ用のメモを新規作成 |
| ジャンプボタン | 該当メモの位置までスクロール |
| 設定ボタン | **ページ内にモーダルを表示**（popup内ではなく） |
| 全体設定 | 拡張機能全体の設定画面に遷移 |
| インポート/エクスポート | JSON形式でバックアップ |

---

## 4. オプションページ（設定画面）

ポップアップの「全体設定」から遷移する専用ページ。

### 4.1 画面構成

#### 4.1.1 タブナビゲーション
| タブ | 内容 |
|------|------|
| 📝 メモ一覧 | すべてのメモをリスト表示 |
| ⚙️ 設定 | デフォルト設定 |
| 📦 インポート/エクスポート | バックアップ・復元 |

#### 4.1.2 メモ一覧画面
- 全メモのカード形式表示
- 検索・フィルター機能
- URLパターンでグループ化
- メモの編集・削除・複製

#### 4.1.3 設定画面
| 項目 | 説明 |
|------|------|
| デフォルトフォントサイズ | 新規メモのデフォルト値（px） |
| デフォルト背景色 | パステルカラーパレットから選択 |
| デフォルト文字色 | テキストの色 |
| ログレベル | debug / info / warn / error |
| 履歴機能 | URLパターン検証用の履歴取得 ON/OFF |

#### 4.1.4 インポート/エクスポート画面
- JSON形式でのエクスポート
- ファイルアップロードによるインポート
- インポート時の選択肢: マージ / 上書き
- バリデーションエラー表示

### 4.2 パステルカラーパレット

付箋風のパステルカラーをデフォルトで提供。

```typescript
const PASTEL_COLORS = {
  yellow: '#FFFFA5',   // 黄色（標準付箋）
  pink: '#FFD6E0',     // ピンク
  blue: '#D6EAFF',     // 水色
  green: '#D6FFD6',    // 緑
  orange: '#FFE4C4',   // オレンジ
  purple: '#E8D6FF',   // 紫
  mint: '#D6FFF0',     // ミント
  peach: '#FFDAB9',    // ピーチ
} as const;

## 5. データ管理

### 5.1 ストレージ
```typescript
interface StorageSchema {
  memos: Memo[];
  settings: GlobalSettings;
  urlPatternPresets: UrlPattern[];  // よく使うパターンのプリセット
}

interface GlobalSettings {
  defaultFontSize: number;           // デフォルト: 14
  defaultBackgroundColor: string;    // デフォルト: '#FFFFA5'
  defaultTextColor: string;          // デフォルト: '#333333'
  colorPalette: string[];            // パステルカラーパレット
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableHistory: boolean;            // 履歴機能の有効/無効
}
```

### 5.2 インポート/エクスポート
- JSON形式でのエクスポート
- インポート時のバリデーション
- マージ or 上書きの選択

---

## 6. SPA対応

### 6.1 URL変更検知
- `chrome.webNavigation.onHistoryStateUpdated` でHistory API変更を検知
- Content Script側で `popstate`, `hashchange` イベントを監視
- Navigation API (Chrome 102+) の活用

### 6.2 DOM変更検知
- `MutationObserver` で動的DOM変更を監視
- アクティブ化トリガーの要素が追加されたら自動でリスナー設定

### 6.3 メモの再評価
- URL変更時にメモの表示/非表示を再評価
- 既存メモの位置・状態を維持

---

## 7. CSS隔離

### 7.1 Shadow DOM
- メモUIはShadow DOM内にレンダリング
- 元ページのCSSの影響を受けない
- 拡張機能のCSSが元ページに影響しない

### 7.2 実装方式
```typescript
// WXTの createShadowRootUi を使用
const ui = createShadowRootUi(ctx, {
  name: 'memo-container',
  position: 'inline',
  anchor: 'body',
  onMount: (container, shadow) => {
    // Reactアプリをマウント
    const root = createRoot(container);
    root.render(<MemoApp />);
  },
});
```

---

## 8. 権限要件

### 8.1 必須権限
```json
{
  "permissions": [
    "storage",           // メモデータの保存
    "activeTab",         // 現在のタブへのアクセス
    "scripting"          // 動的スクリプト注入
  ],
  "host_permissions": [
    "<all_urls>"         // 任意のサイトで動作
  ]
}
```

### 8.2 オプション権限
```json
{
  "optional_permissions": [
    "history",           // URLパターン検証用の履歴取得
    "webNavigation"      // SPA対応のURL変更検知
  ]
}
```

---

## 9. ログ機能

### 9.1 ログレベル
| レベル | 用途 |
|--------|------|
| debug | 開発時の詳細情報 |
| info | 通常の動作ログ |
| warn | 警告（動作に支障なし） |
| error | エラー（機能に影響あり） |

### 9.2 ログ出力
```typescript
// Console出力（開発時）
// chrome.storage への保存（オプション）
logger.debug('Element picker started', { selector });
logger.info('Memo created', { memoId, url });
logger.warn('Selector not found', { selector, url });
logger.error('Storage save failed', { error });
```

---

## 10. 非機能要件

### 10.1 パフォーマンス
- 初期ロード: 100ms以内
- メモ表示: 50ms以内
- DOM監視による負荷を最小限に

### 10.2 互換性
- Chrome 102+ (Navigation API対応)
- Manifest V3 準拠

### 10.3 セキュリティ
- XSSを防ぐMarkdownサニタイズ
- CSP準拠

---

## 11. 用語定義

| 用語 | 定義 |
|------|------|
| メモ | 画面上に表示される付箋 |
| ピン止め | メモをページ内の特定位置に固定（absolute） |
| アクティブ化 | 特定の要素へのアクションでメモを表示する機能 |
| トリガー | アクティブ化を発火させるイベント |
| セレクタ | 要素を特定するためのCSSセレクタ |