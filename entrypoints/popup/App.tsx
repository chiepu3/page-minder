// =============================================================================
// PageMinder - Popup App
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import type { Memo } from '@/types';
import { storage } from '@/lib/storage';
import { matchAnyUrlPattern } from '@/lib/url-matcher';
import { MemoList, AddMemoButton } from '@/components/popup';
import { DEFAULT_SETTINGS, DEFAULT_MEMO_SIZE } from '@/lib/constants';
import { IconStickyNote, IconSettings } from '@/components/icons';
import './style.css';

function App() {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 現在のタブURLとメモを取得
    useEffect(() => {
        const loadData = async () => {
            try {
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

    // 新規メモ作成
    const handleAddMemo = useCallback(async () => {
        if (!currentUrl) {
            setError('現在のURLを取得できません');
            return;
        }

        try {
            const settings = await storage.getSettings();
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

            // Content Scriptにメモ追加を通知（失敗しても問題なし）
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'CREATE_MEMO',
                        payload: newMemo,
                    });
                }
            } catch {
                // Content Scriptが応答しない場合は無視（ページリロードで表示される）
                console.log('Content Script not responding, memo will appear on page reload');
            }
        } catch (err) {
            setError('メモの作成に失敗しました');
            console.error('Failed to create memo:', err);
        }
    }, [currentUrl]);

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
            // ポップアップを閉じる
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
            // ポップアップを閉じる
            window.close();
        } catch (err) {
            console.error('Failed to recall memo:', err);
        }
    }, []);

    // 全体設定ページを開く
    const handleOpenSettings = useCallback(() => {
        chrome.runtime.openOptionsPage();
    }, []);

    return (
        <div className="popup-container">
            <header className="popup-header">
                <IconStickyNote size={24} color="var(--popup-accent)" />
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
                <button className="popup-footer-button" onClick={handleOpenSettings}>
                    <IconSettings size={18} color="currentColor" />
                    全体設定
                </button>
            </footer>
        </div>
    );
}

export default App;
