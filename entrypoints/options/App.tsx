// =============================================================================
// PageMinder - Options Page App
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import type { Memo, GlobalSettings } from '@/types';
import { storage } from '@/lib/storage';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { MemoTable, SettingsPanel, ImportExportPanel } from '@/components/options';
import { IconStickyNote, IconSettings, IconDarkMode, IconLightMode } from '@/components/icons';

const VERSION = browser.runtime.getManifest().version;

type TabType = 'memos' | 'settings' | 'import-export';

function App() {
    const [activeTab, setActiveTab] = useState<TabType>('memos');
    const [memos, setMemos] = useState<Memo[]>([]);
    const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // データ読み込み
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [loadedMemos, loadedSettings] = await Promise.all([
                storage.getMemos(),
                storage.getSettings(),
            ]);
            setMemos(loadedMemos);
            setSettings(loadedSettings);
        } catch (err) {
            setError('データの読み込みに失敗しました');
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // テーマ適用
    useEffect(() => {
        const isDark = settings.theme === 'dark' ||
            (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.body.classList.toggle('light-theme', !isDark);
    }, [settings.theme]);

    // メモ削除
    const handleDeleteMemo = useCallback(async (memoId: string) => {
        try {
            await storage.deleteMemo(memoId);
            setMemos((prev) => prev.filter((m) => m.id !== memoId));
        } catch (err) {
            console.error('Failed to delete memo:', err);
        }
    }, []);

    // メモ更新
    const handleUpdateMemo = useCallback(async (updatedMemo: Memo) => {
        try {
            await storage.saveMemo(updatedMemo);
            setMemos((prev) => prev.map((m) => m.id === updatedMemo.id ? updatedMemo : m));
        } catch (err) {
            console.error('Failed to update memo:', err);
        }
    }, []);

    // 設定保存
    const handleSaveSettings = useCallback(async (newSettings: GlobalSettings) => {
        try {
            await storage.saveSettings(newSettings);
            setSettings(newSettings);
        } catch (err) {
            console.error('Failed to save settings:', err);
        }
    }, []);

    // テーマ切り替え
    const toggleTheme = useCallback(() => {
        const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
        handleSaveSettings({ ...settings, theme: newTheme });
    }, [settings, handleSaveSettings]);

    // インポート完了後
    const handleImportComplete = useCallback(() => {
        loadData();
    }, [loadData]);

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'memos', label: 'メモ一覧', icon: 'sticky_note_2' },
        { id: 'settings', label: '設定', icon: 'settings' },
        { id: 'import-export', label: 'インポート/エクスポート', icon: 'swap_vert' },
    ];

    if (loading) {
        return (
            <div className="options-container">
                <div className="options-loading">読み込み中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="options-container">
                <div className="options-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="options-container">
            {/* Header */}
            <header className="options-header">
                <div className="options-header-left">
                    <IconStickyNote size={32} color="var(--options-accent)" />
                    <h1 className="options-title">PageMinder 設定</h1>
                </div>
                <button
                    className="options-theme-toggle"
                    onClick={toggleTheme}
                    title={settings.theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
                >
                    {settings.theme === 'dark' ? <IconLightMode /> : <IconDarkMode />}
                </button>
            </header>

            {/* Tab Navigation */}
            <nav className="options-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`options-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="material-symbols-outlined">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>

            {/* Tab Content */}
            <main className="options-main">
                {activeTab === 'memos' && (
                    <MemoTable
                        memos={memos}
                        onDelete={handleDeleteMemo}
                        onUpdate={handleUpdateMemo}
                        onRefresh={loadData}
                    />
                )}
                {activeTab === 'settings' && (
                    <SettingsPanel
                        settings={settings}
                        onSave={handleSaveSettings}
                    />
                )}
                {activeTab === 'import-export' && (
                    <ImportExportPanel
                        onImportComplete={handleImportComplete}
                    />
                )}
            </main>

            {/* Footer */}
            <footer className="options-footer">
                <p>PageMinder v{VERSION}</p>
            </footer>
        </div>
    );
}

export default App;
