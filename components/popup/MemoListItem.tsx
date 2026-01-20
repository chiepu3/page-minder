// =============================================================================
// PageMinder - MemoListItem Component
// =============================================================================

import { useState } from 'react';
import type { Memo } from '@/types';
import { IconNote, IconArrowForward, IconStickyNote, IconDelete, IconDragHandle, IconSettings } from '@/components/icons';

interface MemoListItemProps {
    memo: Memo;
    onJump: (memoId: string) => void;
    onRecall: (memoId: string) => void;
    onOpenSettings: (memoId: string) => void;
    onDelete: (memoId: string) => void;
    onDragStart: (e: React.DragEvent, memoId: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, memoId: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
}

/**
 * 個別メモのカード表示
 */
export function MemoListItem({ 
    memo, 
    onJump, 
    onRecall,
    onOpenSettings,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
}: MemoListItemProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // Markdownからプレーンテキストを抽出（記号を除去）
    const stripMarkdown = (text: string): string => {
        return text
            .replace(/^#{1,6}\s+/gm, '')  // 見出し
            .replace(/\*\*(.+?)\*\*/g, '$1')  // 太字
            .replace(/\*(.+?)\*/g, '$1')  // 斜体
            .replace(/~~(.+?)~~/g, '$1')  // 取り消し線
            .replace(/`(.+?)`/g, '$1')  // インラインコード
            .replace(/\[(.+?)\]\(.+?\)/g, '$1')  // リンク
            .replace(/^[\-\*\+]\s+/gm, '')  // 箇条書き
            .replace(/^\d+\.\s+/gm, '')  // 番号付きリスト
            .replace(/\n+/g, ' ')  // 改行をスペースに
            .trim();
    };
    
    // タイトル: memo.title があればそれ、なければ内容から抽出
    const displayTitle = memo.title || stripMarkdown(memo.content).slice(0, 30) || '無題のメモ';
    const preview = stripMarkdown(memo.content).slice(0, 50) + (memo.content.length > 50 ? '...' : '');

    const handleDeleteClick = () => {
        if (showDeleteConfirm) {
            onDelete(memo.id);
        } else {
            setShowDeleteConfirm(true);
            // 3秒後に確認状態をリセット
            setTimeout(() => setShowDeleteConfirm(false), 3000);
        }
    };

    return (
        <div
            className="memo-list-item"
            style={{ backgroundColor: memo.backgroundColor || '#FFFFA5' }}
            draggable
            onDragStart={(e) => onDragStart(e, memo.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, memo.id)}
            onDragEnd={onDragEnd}
        >
            <div className="memo-list-item-header">
                <div 
                    className="memo-list-item-drag-handle"
                    title="ドラッグして並び替え"
                >
                    <IconDragHandle size={16} color="#777" />
                </div>
                <IconNote size={18} color="#555" />
                <span className="memo-list-item-title">{displayTitle}</span>
            </div>
            {memo.content && (
                <div className="memo-list-item-preview">{preview}</div>
            )}
            <div className="memo-list-item-actions">
                <div className="memo-list-item-actions-row">
                    <button
                        className="memo-list-item-button"
                        onClick={() => onJump(memo.id)}
                        title="メモの位置にジャンプ"
                    >
                        <IconArrowForward size={14} color="currentColor" />
                        ジャンプ
                    </button>
                    <button
                        className="memo-list-item-button"
                        onClick={() => onRecall(memo.id)}
                        title="メモを左上に呼び出す"
                    >
                        <IconStickyNote size={14} color="currentColor" />
                        呼び出し
                    </button>
                </div>
                <div className="memo-list-item-actions-row">
                    <button
                        className="memo-list-item-button"
                        onClick={() => onOpenSettings(memo.id)}
                        title="メモの設定を開く"
                    >
                        <IconSettings size={14} color="currentColor" />
                        設定
                    </button>
                    <button
                        className={`memo-list-item-button memo-list-item-button-danger-hover ${showDeleteConfirm ? 'memo-list-item-button-danger' : ''}`}
                        onClick={handleDeleteClick}
                        title={showDeleteConfirm ? '本当に削除？' : 'メモを削除'}
                    >
                        <IconDelete size={14} color={showDeleteConfirm ? '#ef4444' : 'currentColor'} />
                        {showDeleteConfirm ? '確認' : '削除'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MemoListItem;
