// =============================================================================
// PageMinder - Memo Table Component
// =============================================================================

import { useState, useMemo } from 'react';
import type { Memo } from '@/types';

interface MemoTableProps {
    memos: Memo[];
    onDelete: (memoId: string) => void;
    onUpdate: (memo: Memo) => void;
    onRefresh: () => void;
}

/**
 * 全メモを一覧表示するテーブルコンポーネント
 */
export function MemoTable({ memos, onDelete, onUpdate, onRefresh }: MemoTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

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
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    // 編集開始
    const handleEditClick = (memo: Memo) => {
        setEditingMemo(memo);
        setEditTitle(memo.title || '');
        setEditContent(memo.content);
    };

    // 編集保存
    const handleSaveEdit = () => {
        if (editingMemo) {
            onUpdate({
                ...editingMemo,
                title: editTitle,
                content: editContent,
                updatedAt: new Date().toISOString(),
            });
            setEditingMemo(null);
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
                                        className="memo-table-button"
                                        onClick={() => handleEditClick(memo)}
                                        title="編集"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
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

            {/* 編集モーダル */}
            {editingMemo && (
                <div className="memo-edit-modal-overlay" onClick={() => setEditingMemo(null)}>
                    <div className="memo-edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="memo-edit-modal-header">
                            <h3>メモを編集</h3>
                            <button
                                className="memo-edit-modal-close"
                                onClick={() => setEditingMemo(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="memo-edit-modal-body">
                            <div className="memo-edit-field">
                                <label>タイトル</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="タイトルを入力..."
                                />
                            </div>
                            <div className="memo-edit-field">
                                <label>内容（Markdown対応）</label>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    placeholder="内容を入力..."
                                    rows={10}
                                />
                            </div>
                        </div>
                        <div className="memo-edit-modal-footer">
                            <button
                                className="memo-edit-button cancel"
                                onClick={() => setEditingMemo(null)}
                            >
                                キャンセル
                            </button>
                            <button
                                className="memo-edit-button save"
                                onClick={handleSaveEdit}
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
