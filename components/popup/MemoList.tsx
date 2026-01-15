// =============================================================================
// PageMinder - MemoList Component
// =============================================================================

import type { Memo } from '@/types';
import { MemoListItem } from './MemoListItem';
import { IconInbox } from '@/components/icons';

interface MemoListProps {
    memos: Memo[];
    onJump: (memoId: string) => void;
}

/**
 * メモ一覧表示コンポーネント
 */
export function MemoList({ memos, onJump }: MemoListProps) {
    if (memos.length === 0) {
        return (
            <div className="memo-list-empty">
                <IconInbox size={40} color="currentColor" style={{ opacity: 0.6 }} />
                <p>このページにメモはありません</p>
            </div>
        );
    }

    return (
        <div className="memo-list">
            <div className="memo-list-header">
                現在のページのメモ ({memos.length}件)
            </div>
            <div className="memo-list-items">
                {memos.map((memo) => (
                    <MemoListItem
                        key={memo.id}
                        memo={memo}
                        onJump={onJump}
                    />
                ))}
            </div>
        </div>
    );
}

export default MemoList;
