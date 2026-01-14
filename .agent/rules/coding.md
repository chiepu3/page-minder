---
description: TypeScript/Reactのコーディング規約 - 型安全性、命名規則、Reactパターン
---

# コーディングルール

## TypeScript

### 基本原則
- `strict: true` を維持
- `any` 型の使用禁止（`unknown` を使用）
- 型推論に頼らず、関数の引数・戻り値は明示的に型定義
- `as` によるキャストは最小限に

### 命名規則
| 対象 | 形式 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `MemoEditor.tsx` |
| 関数 | camelCase | `handleClick` |
| 定数 | UPPER_SNAKE_CASE | `DEFAULT_FONT_SIZE` |
| 型/インターフェース | PascalCase (プレフィックスなし) | `Memo`, `ActivationConfig` |
| カスタムフック | use prefix | `useMemos`, `useUrlMatch` |

### ファイル構成
- 1ファイル1エクスポートを基本
- index.ts でのバレルエクスポートは `components/` のみ
- テストファイルは同階層に `.test.ts` で配置

---

## React

### コンポーネント
- 関数コンポーネントのみ使用（クラスコンポーネント禁止）
- Props は interface で定義
- デフォルトエクスポートを使用

```typescript
// ✅ Good
interface MemoProps {
  id: string;
  content: string;
  onSave: (content: string) => void;
}

export default function Memo({ id, content, onSave }: MemoProps) {
  // ...
}

// ❌ Bad
export const Memo = (props: any) => { ... }
```

### フック
- カスタムフックは `hooks/` に配置
- 副作用は `useEffect` 内に限定
- 依存配列は exhaustive に

### 状態管理
- ローカル状態: `useState`
- 複雑な状態: `useReducer`
- グローバル状態: Context + useReducer（Redux等は使用しない）

---

## CSS/Tailwind

### Shadow DOM対応
- スタイルは Shadow DOM 内に閉じ込める
- グローバルスタイルの漏出禁止
- `rem` → `px` 変換を適用（postcss-rem-to-px）

### クラス命名
- Tailwindユーティリティを優先
- カスタムクラスが必要な場合は BEM 風に

```tsx
// ✅ Good
<div className="flex items-center gap-2 p-4 bg-memo-yellow rounded-lg">

// ❌ Bad
<div style={{ display: 'flex', alignItems: 'center' }}>
```

---

## エラーハンドリング

### 基本方針
- try-catch は具体的なエラーをキャッチ
- ユーザー向けエラーメッセージは日本語
- 開発者向けログは英語

```typescript
try {
  await storage.save(memo);
} catch (error) {
  logger.error('Failed to save memo', { error, memoId: memo.id });
  throw new UserFacingError('メモの保存に失敗しました');
}
```

---

## インポート順序

```typescript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. 外部ライブラリ
import { getCssSelector } from 'css-selector-generator';

// 3. 内部モジュール（絶対パス）
import { storage } from '@lib/storage';
import { logger } from '@lib/logger';

// 4. コンポーネント
import Button from '@components/common/Button';

// 5. 型
import type { Memo, ActivationConfig } from '@types';

// 6. スタイル
import './styles.css';
```
