// =============================================================================
// PageMinder - Import/Export Panel Component
// =============================================================================

import { useState, useRef } from 'react';
import { storage } from '@/lib/storage';
import { EXPORT_VERSION } from '@/lib/constants';
import type { ExportData, ImportMode, StorageSchema } from '@/types';

interface ImportExportPanelProps {
    onImportComplete: () => void;
}

/**
 * インポート/エクスポート機能パネル
 */
export function ImportExportPanel({ onImportComplete }: ImportExportPanelProps) {
    const [importMode, setImportMode] = useState<ImportMode>('merge');
    const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(
        null
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // エクスポート
    const handleExport = async () => {
        try {
            setIsProcessing(true);
            setResult(null);

            const data = await storage.exportAll();
            const exportData: ExportData = {
                version: EXPORT_VERSION,
                exportedAt: new Date().toISOString(),
                data,
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `pageminder-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setResult({
                type: 'success',
                message: `エクスポートが完了しました（${data.memos.length}件のメモ）`,
            });
        } catch (error) {
            setResult({
                type: 'error',
                message: `エクスポートに失敗しました: ${String(error)}`,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // ファイル選択
    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    // インポート処理
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsProcessing(true);
            setResult(null);

            const text = await file.text();
            const importData = JSON.parse(text) as ExportData;

            // バリデーション
            if (!importData.version || !importData.data) {
                throw new Error('無効なファイル形式です');
            }

            if (!importData.data.memos || !Array.isArray(importData.data.memos)) {
                throw new Error('メモデータが見つかりません');
            }

            // インポート実行
            if (importMode === 'overwrite') {
                await storage.importAll(importData.data);
                setResult({
                    type: 'success',
                    message: `インポートが完了しました（${importData.data.memos.length}件のメモを上書き）`,
                });
            } else {
                const imported = await storage.importMerge(importData.data);
                setResult({
                    type: 'success',
                    message: `インポートが完了しました（${imported}件の新規メモを追加）`,
                });
            }

            onImportComplete();
        } catch (error) {
            setResult({
                type: 'error',
                message: `インポートに失敗しました: ${String(error)}`,
            });
        } finally {
            setIsProcessing(false);
            // ファイル入力をリセット
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="import-export-panel">
            {/* エクスポート */}
            <section className="import-export-section">
                <h3>エクスポート</h3>
                <p>
                    全てのメモと設定をJSONファイルとしてダウンロードします。
                    バックアップや別のブラウザへの移行に使用できます。
                </p>
                <button
                    className="import-export-button"
                    onClick={handleExport}
                    disabled={isProcessing}
                >
                    <span className="material-symbols-outlined">download</span>
                    <span>エクスポート</span>
                </button>
            </section>

            {/* インポート */}
            <section className="import-export-section">
                <h3>インポート</h3>
                <p>
                    以前エクスポートしたJSONファイルをインポートします。
                </p>

                <div className="import-export-options">
                    <label className="import-export-option">
                        <input
                            type="radio"
                            name="importMode"
                            value="merge"
                            checked={importMode === 'merge'}
                            onChange={() => setImportMode('merge')}
                        />
                        <span>マージ（既存データを保持し、新規のみ追加）</span>
                    </label>
                    <label className="import-export-option">
                        <input
                            type="radio"
                            name="importMode"
                            value="overwrite"
                            checked={importMode === 'overwrite'}
                            onChange={() => setImportMode('overwrite')}
                        />
                        <span>上書き（既存データを全て置き換え）</span>
                    </label>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="import-export-file-input"
                    onChange={handleImport}
                />

                <button
                    className="import-export-button secondary"
                    onClick={handleFileSelect}
                    disabled={isProcessing}
                >
                    <span className="material-symbols-outlined">upload</span>
                    <span>ファイルを選択してインポート</span>
                </button>
            </section>

            {/* 結果表示 */}
            {result && (
                <div className={`import-export-result ${result.type}`}>
                    <span className="material-symbols-outlined">
                        {result.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    <span>{result.message}</span>
                </div>
            )}
        </div>
    );
}
