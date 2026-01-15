# PageMinder - AI引き継ぎドキュメント

> 最終更新: 2026-01-15

## プロジェクト概要

**PageMinder** - 業務ミス防止のためのChrome拡張機能（付箋メモ）

- **リポジトリ**: https://github.com/chiepu3/page-minder (プライベート)
- **技術スタック**: WXT + React 18 + TypeScript + Tailwind CSS v4
- **テスト**: Vitest

---

## 完了済み作業

### Phase 1: 基盤レイヤー ✅
| ファイル | 内容 |
|----------|------|
| `types/index.ts` | 全型定義（Memo, UrlPattern, GlobalSettings等） |
| `lib/constants.ts` | パステルカラー、デフォルト設定 |
| `lib/logger.ts` | ログレベル対応ロガー |
| `lib/url-matcher.ts` | ワイルドカード＆正規表現マッチング |
| `lib/storage.ts` | chrome.storage ラッパー |
| `tests/unit/*.test.ts` | 56テスト全パス |

### Phase 2: Content Script ✅
| ファイル | 内容 |
|----------|------|
| `entrypoints/content.tsx` | Shadow DOMセットアップ |
| `components/memo/MemoContainer.tsx` | URLマッチングでメモ表示 |
| `components/memo/Memo.tsx` | ドラッグ、リサイズ、最小化 |
| `components/memo/MemoToolbar.tsx` | ピン止め、カラー、削除 |
| `components/memo/MemoEditor.tsx` | テキスト編集 |
| `hooks/useDraggable.ts` | ドラッグフック |
| `hooks/useResizable.ts` | リサイズフック |

---

## 未完了（次の作業）

### Phase 3: Popup UI
- [ ] 現在ページのメモ一覧
- [ ] 新規メモ作成ボタン
- [ ] ジャンプボタン
- [ ] 「全体設定」リンク

### Phase 4: 機能拡張
- [ ] 要素ピッカー統合（`@botanicastudios/element-selector`）
- [ ] アクティブ化（hover/click/focus）
- [ ] 設定モーダル
- [ ] SPA対応（URL変更検知）

### Phase 5: Options Page
- [ ] メモ一覧タブ
- [ ] 設定タブ
- [ ] インポート/エクスポート

---

## 重要なファイル

| パス | 説明 |
|------|------|
| `docs/specification.md` | 仕様書（420行） |
| `.agent/rules/coding.md` | コーディングルール |
| `.agent/rules/testing.md` | テストルール |
| `.agent/rules/commit.md` | コミットルール |
| `.agent/workflows/feature.md` | TDD実装ワークフロー |

---

## ビルド＆テスト

```bash
npm install          # 依存関係インストール
npm run test         # テスト実行（56件）
npm run build        # 本番ビルド → .output/chrome-mv3/
npm run dev          # 開発サーバー（HMR）
```

---

## GitHub Actions

タグプッシュで自動リリース:
```bash
git tag v0.1.0
git push origin v0.1.0
# → ZIPが自動生成されてReleasesに公開
```

---

## 注意事項

1. **慎重に実装**: 一気に実装せず、1機能ずつTDDで
2. **Tailwind v4**: `@tailwindcss/postcss` を使用（v3とは設定が異なる）
3. **Shadow DOM**: CSS隔離のためShadow DOMを使用
4. **フォント単位**: Content Scriptでは`rem`より`px`推奨（ホストページの影響回避）

---

## 現在の状態

- ビルド成功: 438KB
- テスト: 56件パス
- GitHub: 最新コードがプッシュ済み
- **UI確認**: まだ未実施（SSH環境のため）

次にやるべき: **Phase 3 Popup** を実装してメモ作成できるようにする
