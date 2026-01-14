---
description: Gitコミットメッセージとブランチ戦略のルール
---

# コミットルール

## コミットメッセージ形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
| タイプ | 説明 |
|--------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `style` | フォーマット（機能に影響なし） |
| `refactor` | リファクタリング |
| `test` | テスト追加・修正 |
| `chore` | ビルド、設定変更 |

### Scope
| スコープ | 説明 |
|----------|------|
| `memo` | メモ関連 |
| `picker` | 要素ピッカー |
| `trigger` | トリガー機能 |
| `storage` | ストレージ |
| `ui` | UI全般 |
| `popup` | ポップアップ |
| `settings` | 設定 |
| `deps` | 依存関係 |

### 例
```
feat(picker): 要素選択UIを実装

- @botanicastudios/element-selectorを統合
- ホバーハイライト機能追加
- セレクタ自動生成機能追加

Closes #12
```

---

## コミット粒度

- 1つの論理的変更につき1コミット
- WIP（Work In Progress）コミットは避ける
- 大きな機能は複数の小さなコミットに分割

---

## ブランチ戦略

```
main
  └── feature/P1-01-wxt-setup
  └── feature/P2-01-element-picker
  └── fix/memo-position-bug
```

| ブランチ | 用途 |
|----------|------|
| `main` | 安定版 |
| `feature/<task-id>-<description>` | 機能開発 |
| `fix/<description>` | バグ修正 |
