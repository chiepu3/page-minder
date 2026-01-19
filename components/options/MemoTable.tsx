// =============================================================================
// PageMinder - Memo Table Component
// =============================================================================

import { useState, useMemo } from 'react';
import type { Memo } from '@/types';

interface MemoTableProps {
    memos: Memo[];
    onDelete: (memoId: string) => void;
    onRefresh: () => void;
}

/**
 * 全メモを一覧表示するテーブルコンポーネント
 */
export function MemoTable({ memos, onDelete, onRefresh }: MemoTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // フィルタリング
    const filteredMemos = useMemo(() => {
        if (!searchQuery.trim()) return memos;
        const query = searchQuery.toLowerCase();
        return memos.filter((memo) => {
            const title = (memo.title || '').toLowerCase();
            const content = memo.content.toLowerCase();
            const urls = memo.urlPatterns.map((p) => p.pattern.toLowerCase()).join(' ');
            return title.includes(query) || content.includes(query) || urls.includes(query);
        });
    }, [memos, searchQuery]);

    // 日付フォーマット
    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 削除確認
    const handleDeleteClick = (memoId: string) => {
        if (deleteConfirmId === memoId) {
            onDelete(memoId);
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(memoId);
            // 3秒後にリセット
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    // コンテンツプレビュー
    const getPreview = (content: string) => {
        const plainText = content.replace(/[#*`\[\]]/g, '').trim();
        return plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText;
    };

    // URLパターン表示
    const getUrlDisplay = (memo: Memo) => {
        if (memo.urlPatterns.length === 0) return '-';
        const first = memo.urlPatterns[0].pattern;
        if (memo.urlPatterns.length === 1) return first;
        return `${first} (+${memo.urlPatterns.length - 1})`;
    };

    return (
        <div className="memo-table-container">
            <div className="memo-table-header">
                <h2>メモ一覧 ({filteredMemos.length}件)</h2>
                <div className="memo-table-search">
                    <span className="material-symbols-outlined">search</span>
                    <input
                        type="text"
                        placeholder="検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredMemos.length === 0 ? (
                <div className="memo-table-empty">
                    <span className="material-symbols-outlined memo-table-empty-icon">
                        sticky_note_2
                    </span>
                    <p>{memos.length === 0 ? 'メモがありません' : '検索結果がありません'}</p>
                </div>
            ) : (
                <table className="memo-table">
                    <thead>
                        <tr>
                            <th>タイトル</th>
                            <th>内容</th>
                            <th>URLパターン</th>
                            <th>更新日時</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMemos.map((memo) => (
                            <tr key={memo.id}>
                                <td className="memo-table-title">
                                    {memo.title || '(無題)'}
                                </td>
                                <td className="memo-table-preview">
                                    {getPreview(memo.content)}
                                </td>
                                <td className="memo-table-url">
                                    {getUrlDisplay(memo)}
                                </td>
                                <td className="memo-table-date">
                                    {formatDate(memo.updatedAt)}
                                </td>
                                <td className="memo-table-actions">
                                    <button
                                        className={`memo-table-button danger ${
                                            deleteConfirmId === memo.id ? 'confirm' : ''
                                        }`}
                                        onClick={() => handleDeleteClick(memo.id)}
                                        title={
                                            deleteConfirmId === memo.id
                                                ? 'もう一度クリックで削除'
                                                : '削除'
                                        }
                                    >
                                        <span className="material-symbols-outlined">
                                            {deleteConfirmId === memo.id ? 'check' : 'delete'}
                                        </span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
