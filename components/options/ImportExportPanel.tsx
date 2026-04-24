// =============================================================================
// PageMinder - Import/Export Panel Component
// =============================================================================

import { useState, useRef } from 'react';
import JSZip from 'jszip';
import { storage } from '@/lib/storage';
import { EXPORT_VERSION } from '@/lib/constants';
import type { ExportData, ImportMode, StorageSchema } from '@/types';
import { getAllImages, importImages } from '@/lib/image-storage';
import type { ImageRecord } from '@/lib/image-storage';

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

    // エクスポート (ZIP)
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

            const zip = new JSZip();
            zip.file('memos.json', JSON.stringify(exportData, null, 2));

            const images = await getAllImages();
            if (images.length > 0) {
                const imagesFolder = zip.folder('images');
                for (const img of images) {
                    imagesFolder!.file(img.id, img.blob);
                }
            }

            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `pageminder-backup-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setResult({
                type: 'success',
                message: `エクスポートが完了しました（${data.memos.length}件のメモ、${images.length}件の画像）`,
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

    // インポート処理 (ZIP or JSON)
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsProcessing(true);
            setResult(null);

            if (file.name.endsWith('.zip')) {
                await handleZipImport(file);
            } else {
                await handleJsonImport(file);
            }

            onImportComplete();
        } catch (error) {
            setResult({
                type: 'error',
                message: `インポートに失敗しました: ${String(error)}`,
            });
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleZipImport = async (file: File) => {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        const memosFile = zip.file('memos.json');
        if (!memosFile) {
            throw new Error('memos.json が見つかりません');
        }

        const text = await memosFile.async('string');
        const importData = JSON.parse(text) as ExportData;

        if (!importData.version || !importData.data) {
            throw new Error('無効なファイル形式です');
        }

        if (!importData.data.memos || !Array.isArray(importData.data.memos)) {
            throw new Error('メモデータが見つかりません');
        }

        // メモデータをインポート
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

        // 画像をインポート
        const imagesFolder = zip.folder('images');
        if (imagesFolder) {
            const imageFiles = imagesFolder.filter(() => true);
            if (imageFiles.length > 0) {
                const imageRecords: ImageRecord[] = [];
                for (const imgFile of imageFiles) {
                    const id = imgFile.name;
                    const blob = await imgFile.async('blob');
                    imageRecords.push({
                        id,
                        blob,
                        mimeType: 'image/webp',
                        createdAt: new Date().toISOString(),
                    });
                }
                await importImages(imageRecords);
            }
        }
    };

    const handleJsonImport = async (file: File) => {
        const text = await file.text();
        const importData = JSON.parse(text) as ExportData;

        if (!importData.version || !importData.data) {
            throw new Error('無効なファイル形式です');
        }

        if (!importData.data.memos || !Array.isArray(importData.data.memos)) {
            throw new Error('メモデータが見つかりません');
        }

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
    };

    return (
        <div className="import-export-panel">
            {/* エクスポート */}
            <section className="import-export-section">
                <h3>エクスポート</h3>
                <p>
                    全てのメモ・画像・設定をZIPファイルとしてダウンロードします。
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
                    以前エクスポートしたZIPファイルまたはJSONファイルをインポートします。
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
                    accept=".json,.zip"
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
