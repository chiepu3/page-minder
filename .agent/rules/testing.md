---
description: テスト作成時のルール - ユニット/統合/E2Eテスト、モック戦略
---

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
| 対象 | 目標 |
|------|------|
| lib/ | 90%以上 |
| hooks/ | 80%以上 |
| components/ | 70%以上 |

---

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

---

## E2Eテスト

### 対象
- クリティカルパス（メモ作成、編集、削除）
- エッジケース

### 構成
```typescript
// tests/e2e/memo.spec.ts
import { test, expect } from '@playwright/test';

test.describe('PageMinder Extension', () => {
  test.beforeEach(async ({ page, context }) => {
    // 拡張機能のロード
  });

  test('should display memo on matching URL', async ({ page }) => {
    await page.goto('https://example.com/test');
    await expect(page.locator('.memo-container')).toBeVisible();
  });
});
```

---

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

---

## ⚠️ 重要: 本番データ保護

> [!CAUTION]
> テストは必ず隔離された環境で実行すること。
> 本番データを操作するテストは禁止。

### 必須
- テストはモックストレージを使用
- 各テストで独立したセットアップ/クリーンアップ
- 実際のchrome.storage.localへの書き込みなし
