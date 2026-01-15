// =============================================================================
// PageMinder - MemoList Component
// =============================================================================

import { useState } from 'react';
import type { Memo } from '@/types';
import { MemoListItem } from './MemoListItem';
import { IconInbox } from '@/components/icons';

interface MemoListProps {
    memos: Memo[];
    onJump: (memoId: string) => void;
    onRecall: (memoId: string) => void;
    onDelete: (memoId: string) => void;
    onReorder: (memos: Memo[]) => void;
}

/**
 * メモ一覧表示コンポーネント
 */
export function MemoList({ memos, onJump, onRecall, onDelete, onReorder }: MemoListProps) {
    const [draggedMemoId, setDraggedMemoId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, memoId: string) => {
        setDraggedMemoId(memoId);
        e.dataTransfer.effectAllowed = 'move';
        // ドラッグ中のスタイル設定
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetMemoId: string) => {
        e.preventDefault();
        
        if (!draggedMemoId || draggedMemoId === targetMemoId) {
            setDraggedMemoId(null);
            return;
        }

        const draggedIndex = memos.findIndex(m => m.id === draggedMemoId);
        const targetIndex = memos.findIndex(m => m.id === targetMemoId);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedMemoId(null);
            return;
        }

        // メモの順序を入れ替え
        const newMemos = [...memos];
        const [draggedMemo] = newMemos.splice(draggedIndex, 1);
        newMemos.splice(targetIndex, 0, draggedMemo);

        onReorder(newMemos);
        setDraggedMemoId(null);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
        setDraggedMemoId(null);
    };

    if (memos.length === 0) {
        return (
            <div className="memo-list-empty">
                <IconInbox size={40} color="currentColor" style={{ opacity: 0.6 }} />
                <p>このページにメモはありません</p>
            </div>
        );
    }

    return (
        <div className="memo-list" onDragEnd={handleDragEnd}>
            <div className="memo-list-header">
                現在のページのメモ ({memos.length}件) - ドラッグで並び替え
            </div>
            <div className="memo-list-items">
                {memos.map((memo) => (
                    <MemoListItem
                        key={memo.id}
                        memo={memo}
                        onJump={onJump}
                        onRecall={onRecall}
                        onDelete={onDelete}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                    />
                ))}
            </div>
        </div>
    );
}

export default MemoList;
