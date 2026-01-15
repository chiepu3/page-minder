---
description: UIデザインルール - カラーパレット、アイコン、スタイリング規約
---

# デザインルール

## カラーパレット

### パステルカラー（付箋風）
- 付箋やClaudeのようなパステルカラーを基調とする
- ダークモードでもパステル調を維持

### メモカラー
```css
--color-yellow: #FFFFA5;   /* 黄色（標準） */
--color-pink: #FFD6E0;     /* ピンク */
--color-blue: #D6EAFF;     /* 水色 */
--color-green: #D6FFD6;    /* 緑 */
--color-orange: #FFE4C4;   /* オレンジ */
--color-purple: #E8D6FF;   /* 紫 */
--color-mint: #D6FFF0;     /* ミント */
--color-peach: #FFDAB9;    /* ピーチ */
```

### ダークモード背景
```css
--bg-dark: #1a1a2e;
--surface-dark: #16213e;
--border-dark: #0f3460;
```

---

## アイコン

### ルール
- **絵文字は使用禁止** ❌
- **Material Symbols** または **Lucide Icons** を使用
- 単色のシンプルなアイコンを使う
- AIらしさを排除し、プロフェッショナルな印象に

### 使用アイコン例
| 用途 | アイコン名 |
|------|-----------|
| メモ | `note` / `sticky_note_2` |
| 追加 | `add` |
| 設定 | `settings` |
| 削除 | `delete` |
| 編集 | `edit` |
| ピン | `push_pin` |
| 最小化 | `remove` |
| ジャンプ | `arrow_forward` |

### 実装方法
```html
<!-- Material Symbols Outlined -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />

<span class="material-symbols-outlined">note</span>
```

---

## タイポグラフィ

- **フォント**: Inter, system-ui
- **サイズ**: 
  - 見出し: 18px
  - 本文: 14px
  - 補助: 12px
