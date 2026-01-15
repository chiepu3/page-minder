// =============================================================================
// PageMinder - MemoListItem Component
// =============================================================================

import type { Memo } from '@/types';
import { IconNote, IconArrowForward } from '@/components/icons';

interface MemoListItemProps {
    memo: Memo;
    onJump: (memoId: string) => void;
}

/**
 * 個別メモのカード表示
 */
export function MemoListItem({ memo, onJump }: MemoListItemProps) {
    const displayTitle = memo.title || memo.content.slice(0, 30) || '無題のメモ';
    const preview = memo.content.slice(0, 50) + (memo.content.length > 50 ? '...' : '');

    return (
        <div
            className="memo-list-item"
            style={{ backgroundColor: memo.backgroundColor || '#FFFFA5' }}
        >
            <div className="memo-list-item-header">
                <IconNote size={18} color="#555" />
                <span className="memo-list-item-title">{displayTitle}</span>
            </div>
            {memo.content && (
                <div className="memo-list-item-preview">{preview}</div>
            )}
            <div className="memo-list-item-actions">
                <button
                    className="memo-list-item-button"
                    onClick={() => onJump(memo.id)}
                    title="メモの位置にジャンプ"
                >
                    <IconArrowForward size={14} color="currentColor" />
                    ジャンプ
                </button>
            </div>
        </div>
    );
}

export default MemoListItem;
