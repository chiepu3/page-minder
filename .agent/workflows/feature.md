---
description: 新機能を実装する際のTDDワークフロー - 要件確認から実装まで
---

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

---

## チェックリスト

- [ ] TypeScript strict modeでエラーなし
- [ ] テストカバレッジ基準達成
- [ ] ESLintエラーなし
- [ ] コミットメッセージがルールに準拠
- [ ] 関連ドキュメント更新済み

---

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
