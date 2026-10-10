# 全体設定のアクティブ化待ち時間と既存メモの互換

## 意図の確認

[2026-01-19の変更 eb3a3179](https://github.com/chiepu3/page-minder/commit/eb3a3179a005aa10a4424398d92f458e815fbaf8) で、表示遅延と非表示猶予はGlobalSettingsへ移されました。現行hookも全体設定を参照しています。

一方、個別メモ設定には実際には使われない `activation.delay` の入力欄が残っていました。また全体設定の入力処理は `parseInt(value) || default` のため、0msを保存できず500/300msへ戻していました。

## 変更

- 全体設定の表示遅延/非表示猶予で0msをそのまま保存する。
- 空欄の既定値復帰、非ゼロ値、整数解析の既存挙動は維持する。
- 個別設定の効かない入力を、現在有効な全体設定値と変更場所の案内へ置き換える。
- 旧 `activation.delay` は既存メモに保持する。データ移行や値の削除はしない。
- 実行時の優先順位やhookのタイマー処理は変更しない。

## 検証

```sh
npm ci --ignore-scripts
npx wxt prepare
npm test -- --run tests/integration/activation-delay-settings.test.tsx
npm test -- --run
npm run build
```

main `975474a862f5355008584ae24cabd938638feff0` で初期8ケース中4 FAIL / 4 PASS。表示遅延0が500、猶予0が300になり、保存値を実hookへ渡しても即時表示にならないことを確認しました。

修正後は9ケース・全78テスト・Chrome MV3ビルド・diffcheckが成功。

- 0msの保存と実hookへの適用
- 非ゼロ値と空欄の従来挙動
- 実効の全体値の表示
- 個別の旧delay=1500を保存時に変更しない
- 取消時に保存せず、元メモも変更しない

検証はReact Testing Library/jsdomとfake timersです。実Chromeの画面表示・E2Eは未検証です。単体main基準の型チェックには既存chrome型関連24診断が残り、解消は独立したPR #3の範囲です。

権限、依存、永続形式、バージョンは変更しません。draftの提案であり、mergeや配備は行いません。
