# 最初のタスク指示

## はじめに

このドキュメントは、Chrome拡張機能「PageMinder」プロジェクトの初期セットアップをAntigravityに依頼するための指示書です。

**添付資料:**
- `01_SPECIFICATION.md` - 仕様書
- `02_IMPLEMENTATION_PLAN.md` - 実装計画書

---

## タスク1: ライブラリ選定のセカンドオピニオン

### 依頼内容

以下のライブラリ選定について、最新情報を調査し、より良い選択肢があればフィードバックをください。
特に「実装コスト」「バンドルサイズ」「メンテナンス状況」の観点で評価してください。

### 現在の選定

| カテゴリ | 選定 | 選定理由 |
|----------|------|----------|
| 拡張機能フレームワーク | **WXT** | Viteベース、TypeScript標準、Shadow DOM対応、Manifest V3 |
| UIフレームワーク | **React 18** | コンポーネント指向、フック、エコシステム |
| 要素ピッカー | **@botanicastudios/element-selector** | 最新（2025年12月）、複数選択対応、CSSセレクタ生成内蔵 |
| セレクタ生成 | *(element-selector内蔵を使用)* | 要素ピッカーに統合 |
| Markdownエディタ | **@uiw/react-md-editor** | 軽量（~30KB）、シンプル |
| スタイリング | **Tailwind CSS** | ユーティリティファースト、Shadow DOM対応可 |
| テスト | **Vitest** | Vite統合、高速 |
| E2Eテスト | **Playwright** | クロスブラウザ、拡張機能対応 |

### 確認してほしい点

1. **WXT vs Plasmo**: 最新の比較情報。PlasmoはParcelベースで懸念あるが最新状況は？
2. **Milkdown vs MDXEditor vs @uiw/react-md-editor**: 
   - バンドルサイズの実測値
   - Shadow DOM内での動作実績
   - プラグインの安定性
3. **要素ピッカー代替案**: 
   - `@botanicastudios/element-selector` は新しいが良さそう
   - `pick-dom-element` の評価
4. **Tailwind CSS in Shadow DOM**: 
   - WXTでの推奨設定
   - 代替案（vanilla-extract, CSS Modules等）

### 期待する出力

```markdown
## ライブラリ評価レポート

### 推奨維持
- xxx: 理由

### 変更推奨
- xxx → yyy: 理由

### 追加推奨
- xxx: 理由
```

---

## タスク2: 環境構築

### 2.1 プロジェクト作成

```bash
# WXTプロジェクト作成
npx wxt@latest init work-memo-overlay

# 選択肢:
# - Template: React
# - TypeScript: Yes
# - Package manager: npm (or pnpm)
```

### 2.2 依存関係インストール

```bash
# コア依存
npm install react react-dom
npm install -D @types/react @types/react-dom

# 要素ピッカー・セレクタ
npm install js-element-picker css-selector-generator

# Markdownエディタ（Milkdown）
npm install @milkdown/core @milkdown/preset-commonmark @milkdown/react
npm install @milkdown/plugin-slash @milkdown/plugin-listener
npm install @milkdown/theme-nord

# スタイリング
npm install -D tailwindcss postcss autoprefixer

# ユーティリティ
npm install uuid
npm install -D @types/uuid

# テスト
npm install -D vitest @testing-library/react @testing-library/dom
npm install -D playwright @playwright/test
npm install -D jsdom
```

### 2.3 設定ファイル作成

#### wxt.config.ts
```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Work Memo Overlay',
    description: '業務メモを画面上に表示する拡張機能',
    version: '0.1.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    optional_permissions: ['history', 'webNavigation'],
    host_permissions: ['<all_urls>'],
  },
});
```

#### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './entrypoints/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        memo: {
          yellow: '#FFFFA5',
          blue: '#A5D6FF',
          green: '#A5FFB5',
          pink: '#FFA5D6',
        },
      },
    },
  },
  plugins: [],
};
```

#### tsconfig.json（追加設定）
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@components/*": ["./components/*"],
      "@lib/*": ["./lib/*"],
      "@hooks/*": ["./hooks/*"],
      "@types/*": ["./types/*"]
    }
  }
}
```

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@lib': path.resolve(__dirname, './lib'),
      '@hooks': path.resolve(__dirname, './hooks'),
      '@types': path.resolve(__dirname, './types'),
    },
  },
});
```

### 2.4 ディレクトリ構造作成

```bash
mkdir -p components/{memo,picker,settings,common}
mkdir -p lib hooks types styles
mkdir -p tests/{unit,integration,e2e}
mkdir -p .antigravity/{rules,workflows}
```

---

## タスク3: Agent Skills作成

### 3.1 コーディングルール

**ファイル: `.antigravity/rules/coding.md`**

```markdown
# コーディングルール

## TypeScript

### 基本原則
- `strict: true` を維持
- `any` 型の使用禁止（`unknown` を使用）
- 型推論に頼らず、関数の引数・戻り値は明示的に型定義
- `as` によるキャストは最小限に

### 命名規則
- コンポーネント: PascalCase (`MemoEditor.tsx`)
- 関数: camelCase (`handleClick`)
- 定数: UPPER_SNAKE_CASE (`DEFAULT_FONT_SIZE`)
- 型/インターフェース: PascalCase, プレフィックスなし (`Memo`, `ActivationConfig`)
- フック: use prefix (`useMemos`, `useUrlMatch`)

### ファイル構成
- 1ファイル1エクスポートを基本
- index.ts でのバレルエクスポートは components/ のみ
- テストファイルは同階層に `.test.ts` で配置

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

## CSS/Tailwind

### Shadow DOM対応
- スタイルは Shadow DOM 内に閉じ込める
- グローバルスタイルの漏出禁止

### クラス命名
- Tailwindユーティリティを優先
- カスタムクラスが必要な場合は BEM 風に

```tsx
// ✅ Good
<div className="flex items-center gap-2 p-4 bg-memo-yellow rounded-lg">

// ❌ Bad
<div style={{ display: 'flex', alignItems: 'center' }}>
```

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
```

### 3.2 テストルール

**ファイル: `.antigravity/rules/testing.md`**

```markdown
# テストルール

## ユニットテスト

### 対象
- `lib/` 配下の全関数
- カスタムフック
- ユーティリティ関数

### 命名規則
```typescript
describe('urlMatcher', () => {
  describe('matchWildcard', () => {
    it('should match exact URL', () => {});
    it('should match wildcard in path', () => {});
    it('should return false for non-matching URL', () => {});
  });
});
```

### カバレッジ目標
- lib/: 90%以上
- hooks/: 80%以上
- components/: 70%以上

## 統合テスト

### 対象
- ユーザーフロー全体
- コンポーネント間の連携

### パターン
```typescript
describe('Memo Creation Flow', () => {
  it('should create memo and save to storage', async () => {
    // Arrange
    const mockStorage = createMockStorage();
    
    // Act
    render(<MemoApp storage={mockStorage} />);
    await userEvent.click(screen.getByText('新規作成'));
    await userEvent.type(screen.getByRole('textbox'), 'テストメモ');
    await userEvent.click(screen.getByText('保存'));
    
    // Assert
    expect(mockStorage.save).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'テストメモ' })
    );
  });
});
```

## E2Eテスト

### 対象
- クリティカルパス
- エッジケース

### 構成
```typescript
// tests/e2e/memo.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Memo Extension', () => {
  test.beforeEach(async ({ page, context }) => {
    // 拡張機能のロード
    await context.addInitScript(() => {
      // Mock chrome APIs if needed
    });
  });

  test('should display memo on matching URL', async ({ page }) => {
    await page.goto('https://example.com/test');
    await expect(page.locator('.memo-container')).toBeVisible();
  });
});
```

## モック

### chrome API
```typescript
// tests/mocks/chrome.ts
export const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
  },
};

// setup.ts
vi.stubGlobal('chrome', mockChrome);
```
```

### 3.3 コミットルール

**ファイル: `.antigravity/rules/commit.md`**

```markdown
# コミットルール

## コミットメッセージ形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット（機能に影響なし）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド、設定変更

### Scope
- `memo`: メモ関連
- `picker`: 要素ピッカー
- `trigger`: トリガー機能
- `storage`: ストレージ
- `ui`: UI全般
- `popup`: ポップアップ
- `settings`: 設定
- `deps`: 依存関係

### 例
```
feat(picker): 要素選択UIを実装

- js-element-pickerを統合
- ホバーハイライト機能追加
- セレクタ自動生成機能追加

Closes #12
```

## コミット粒度

- 1つの論理的変更につき1コミット
- WIP（Work In Progress）コミットは避ける
- 大きな機能は複数の小さなコミットに分割

## ブランチ戦略

```
main
  └── feature/P1-01-wxt-setup
  └── feature/P2-01-element-picker
  └── fix/memo-position-bug
```

- `main`: 安定版
- `feature/<task-id>-<description>`: 機能開発
- `fix/<description>`: バグ修正
```

### 3.4 機能実装ワークフロー

**ファイル: `.antigravity/workflows/feature.md`**

```markdown
# 機能実装ワークフロー

## 手順

### 1. 要件確認
- 仕様書の該当セクションを確認
- 不明点があれば質問

### 2. 設計
- 必要なファイル一覧を作成
- インターフェース定義
- 依存関係の確認

### 3. テスト作成（TDD）
```typescript
// 先にテストを書く
describe('UrlMatcher', () => {
  it('should match wildcard pattern', () => {
    expect(matchUrl('https://example.com/test', 'https://example.com/*')).toBe(true);
  });
});
```

### 4. 実装
- テストが通るように実装
- 型安全性を確保

### 5. リファクタリング
- 重複コードの排除
- 命名の見直し
- パフォーマンス最適化

### 6. レビュー準備
- Lintエラー解消
- テスト全パス確認
- ドキュメント更新

## チェックリスト

- [ ] TypeScript strict modeでエラーなし
- [ ] テストカバレッジ基準達成
- [ ] ESLintエラーなし
- [ ] コミットメッセージがルールに準拠
- [ ] 関連ドキュメント更新済み

## 実装パターン

### 新しいコンポーネント
```typescript
// 1. 型定義
interface Props { ... }

// 2. コンポーネント
export default function Component({ ... }: Props) {
  // 3. ステート
  const [state, setState] = useState();
  
  // 4. エフェクト
  useEffect(() => {}, []);
  
  // 5. ハンドラー
  const handleClick = () => {};
  
  // 6. レンダリング
  return <div>...</div>;
}
```

### 新しいフック
```typescript
// 1. 型定義
interface UseXxxOptions { ... }
interface UseXxxReturn { ... }

// 2. フック実装
export function useXxx(options: UseXxxOptions): UseXxxReturn {
  // ...
}
```
```

---

## タスク4: 基盤ファイル作成

### 4.1 型定義

**ファイル: `types/index.ts`**

```typescript
// Memo関連
export interface Memo {
  id: string;
  title?: string;
  content: string;
  fontSize?: number;
  backgroundColor?: string;
  textColor?: string;
  urlPatterns: UrlPattern[];
  positions: Record<string, MemoPosition>;
  minimized: boolean;
  activation?: ActivationConfig;
  createdAt: string;
  updatedAt: string;
}

export interface MemoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
}

// URLパターン
export interface UrlPattern {
  id: string;
  type: 'wildcard' | 'regex';
  pattern: string;
  description?: string;
}

// アクティブ化
export interface ActivationConfig {
  enabled: boolean;
  trigger: 'hover' | 'click' | 'focus' | 'info-icon';
  selector: string;
  delay?: number;
  positionMode: 'near-element' | 'fixed-position';
  offsetX?: number;
  offsetY?: number;
  highlightElement?: boolean;
  highlightColor?: string;
}

// 設定
export interface GlobalSettings {
  defaultFontSize: number;
  defaultBackgroundColor: string;
  logLevel: LogLevel;
  enableHistory: boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ストレージ
export interface StorageSchema {
  memos: Memo[];
  settings: GlobalSettings;
  urlPatternPresets: UrlPattern[];
}
```

### 4.2 ロガー

**ファイル: `lib/logger.ts`**

```typescript
import type { LogLevel } from '@types';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel = 'info';
  private prefix = '[WorkMemoOverlay]';

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(`${this.prefix}[DEBUG]`, message, data ?? '');
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(`${this.prefix}[INFO]`, message, data ?? '');
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(`${this.prefix}[WARN]`, message, data ?? '');
    }
  }

  error(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(`${this.prefix}[ERROR]`, message, data ?? '');
    }
  }
}

export const logger = new Logger();
```

### 4.3 ストレージ

**ファイル: `lib/storage.ts`**

```typescript
import type { Memo, GlobalSettings, StorageSchema, UrlPattern } from '@types';
import { logger } from './logger';

const DEFAULT_SETTINGS: GlobalSettings = {
  defaultFontSize: 14,
  defaultBackgroundColor: '#FFFFA5',
  logLevel: 'info',
  enableHistory: false,
};

class Storage {
  private async get<K extends keyof StorageSchema>(
    key: K
  ): Promise<StorageSchema[K] | undefined> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key];
    } catch (error) {
      logger.error('Storage get failed', { key, error });
      throw error;
    }
  }

  private async set<K extends keyof StorageSchema>(
    key: K,
    value: StorageSchema[K]
  ): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
      logger.debug('Storage set', { key });
    } catch (error) {
      logger.error('Storage set failed', { key, error });
      throw error;
    }
  }

  // Memo CRUD
  async getMemos(): Promise<Memo[]> {
    return (await this.get('memos')) ?? [];
  }

  async saveMemo(memo: Memo): Promise<void> {
    const memos = await this.getMemos();
    const index = memos.findIndex((m) => m.id === memo.id);
    
    if (index >= 0) {
      memos[index] = { ...memo, updatedAt: new Date().toISOString() };
    } else {
      memos.push({
        ...memo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    await this.set('memos', memos);
    logger.info('Memo saved', { memoId: memo.id });
  }

  async deleteMemo(memoId: string): Promise<void> {
    const memos = await this.getMemos();
    const filtered = memos.filter((m) => m.id !== memoId);
    await this.set('memos', filtered);
    logger.info('Memo deleted', { memoId });
  }

  // Settings
  async getSettings(): Promise<GlobalSettings> {
    return (await this.get('settings')) ?? DEFAULT_SETTINGS;
  }

  async saveSettings(settings: GlobalSettings): Promise<void> {
    await this.set('settings', settings);
    logger.info('Settings saved');
  }

  // Export/Import
  async exportAll(): Promise<StorageSchema> {
    const memos = await this.getMemos();
    const settings = await this.getSettings();
    const urlPatternPresets = (await this.get('urlPatternPresets')) ?? [];
    return { memos, settings, urlPatternPresets };
  }

  async importAll(data: StorageSchema): Promise<void> {
    // バリデーションは呼び出し側で行う
    await this.set('memos', data.memos);
    await this.set('settings', data.settings);
    await this.set('urlPatternPresets', data.urlPatternPresets);
    logger.info('Data imported');
  }
}

export const storage = new Storage();
```

---

## タスク5: 動作確認

### 確認項目

1. **ビルド成功**
   ```bash
   npm run build
   ```

2. **Chrome読み込み**
   - `chrome://extensions` を開く
   - 「デベロッパーモード」ON
   - 「パッケージ化されていない拡張機能を読み込む」
   - `.output/chrome-mv3` を選択

3. **Content Script動作**
   - 任意のページで開発者ツールを開く
   - Console に `[WorkMemoOverlay]` のログが出力されることを確認

4. **テスト実行**
   ```bash
   npm run test
   ```

---

## 期待する成果物

タスク完了後、以下の状態を確認してください：

- [ ] WXTプロジェクトがビルド成功
- [ ] Chromeで拡張機能が読み込み可能
- [ ] `.antigravity/` 配下にルール・ワークフローファイル
- [ ] `lib/logger.ts`, `lib/storage.ts` が実装済み
- [ ] `types/index.ts` に型定義
- [ ] ユニットテストが実行可能
- [ ] ライブラリ評価レポートの作成

---

## 質問があれば

実装中に不明点や判断が必要な点があれば、以下の形式で質問してください：

```
## 質問: [タイトル]

### 背景
[なぜこの質問が発生したか]

### 選択肢
1. [選択肢A]: メリット / デメリット
2. [選択肢B]: メリット / デメリット

### 推奨
[あなたの推奨とその理由]
```