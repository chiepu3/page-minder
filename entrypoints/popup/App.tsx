// =============================================================================
// PageMinder - Popup App
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import type { Memo, GlobalSettings } from '@/types';
import { storage } from '@/lib/storage';
import { matchAnyUrlPattern } from '@/lib/url-matcher';
import { MemoList, AddMemoButton } from '@/components/popup';
import { DEFAULT_SETTINGS, DEFAULT_MEMO_SIZE } from '@/lib/constants';
import { IconStickyNote, IconSettings, IconDarkMode, IconLightMode } from '@/components/icons';
import './style.css';

function App() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [memos, setMemos] = useState<Memo[]>([]);
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 設定とデータをロード
    useEffect(() => {
        const loadData = async () => {
            try {
                // 設定をロード
                const globalSettings = await storage.getSettings();
                setSettings(globalSettings);

                // テーマ適用
                if (globalSettings.theme === 'light') {
                    document.body.classList.add('light-theme');
                } else {
                    document.body.classList.remove('light-theme');
                }

                // 現在のタブURLを取得
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const url = tab?.url || '';
                setCurrentUrl(url);

                // 全メモを取得してURLでフィルタ
                const allMemos = await storage.getMemos();
                const matchingMemos = allMemos.filter(memo =>
                    matchAnyUrlPattern(url, memo.urlPatterns)
                );
                setMemos(matchingMemos);
            } catch (err) {
                setError('データの読み込みに失敗しました');
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // テーマ切り替え
    const handleToggleTheme = useCallback(async () => {
        const newTheme: 'light' | 'dark' = settings.theme === 'light' ? 'dark' : 'light';
        const newSettings: GlobalSettings = { ...settings, theme: newTheme };
        
        await storage.saveSettings(newSettings);
        setSettings(newSettings);

        if (newTheme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }

        // 全タブのContent Scriptに通知
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'SAVE_SETTINGS',
                    payload: newSettings
                }).catch(() => {});
            }
        });
    }, [settings]);

    // 新規メモ作成
    const handleAddMemo = useCallback(async () => {
        if (!currentUrl) {
            setError('現在のURLを取得できません');
            return;
        }

        try {
            const patternId = crypto.randomUUID();
            
            const newMemo: Memo = {
                id: crypto.randomUUID(),
                content: '',
                urlPatterns: [{
                    id: patternId,
                    type: 'wildcard',
                    pattern: currentUrl,
                    description: '現在のページ',
                }],
                positions: {
                    [patternId]: {
                        x: 100,
                        y: 100,
                        width: DEFAULT_MEMO_SIZE.width,
                        height: DEFAULT_MEMO_SIZE.height,
                        pinned: false,
                    },
                },
                minimized: false,
                backgroundColor: settings.defaultBackgroundColor || DEFAULT_SETTINGS.defaultBackgroundColor,
                textColor: settings.defaultTextColor || DEFAULT_SETTINGS.defaultTextColor,
                fontSize: settings.defaultFontSize || DEFAULT_SETTINGS.defaultFontSize,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await storage.saveMemo(newMemo);
            setMemos(prev => [...prev, newMemo]);

            // Content Scriptにメモ追加を通知
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'CREATE_MEMO',
                        payload: newMemo,
                    });
                }
            } catch {
                console.log('Content Script not responding, memo will appear on page reload');
            }
        } catch (err) {
            setError('メモの作成に失敗しました');
            console.error('Failed to create memo:', err);
        }
    }, [currentUrl, settings]);

    // メモへジャンプ
    const handleJump = useCallback(async (memoId: string) => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'SCROLL_TO_MEMO',
                    payload: { memoId },
                });
            }
            window.close();
        } catch (err) {
            console.error('Failed to scroll to memo:', err);
        }
    }, []);

    // メモを左上に呼び出す
    const handleRecall = useCallback(async (memoId: string) => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'MOVE_MEMO_TO_VISIBLE',
                    payload: { memoId },
                });
            }
            window.close();
        } catch (err) {
            console.error('Failed to recall memo:', err);
        }
    }, []);

    const handleOpenSettings = useCallback(() => {
        chrome.runtime.openOptionsPage();
    }, []);

    return (
        <div className="popup-container">
            <header className="popup-header">
                <IconStickyNote size={24} color="var(--popup-header-icon)" />
                <h1 className="popup-title">PageMinder</h1>
            </header>

            <main className="popup-main">
                <AddMemoButton onClick={handleAddMemo} disabled={!currentUrl} />

                {loading ? (
                    <div className="popup-loading">読み込み中...</div>
                ) : error ? (
                    <div className="popup-error">{error}</div>
                ) : (
                    <MemoList memos={memos} onJump={handleJump} onRecall={handleRecall} />
                )}
            </main>

            <footer className="popup-footer">
                <button className="popup-footer-button" onClick={handleToggleTheme} title="テーマ切り替え">
                    {settings.theme === 'light' ? <IconDarkMode size={18} /> : <IconLightMode size={18} />}
                    テーマ
                </button>
                <div style={{ flex: 1 }} />
                <button className="popup-footer-button" onClick={handleOpenSettings}>
                    <IconSettings size={18} color="currentColor" />
                    全体設定
                </button>
            </footer>
        </div>
    );
}

export default App;
