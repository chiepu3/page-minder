// =============================================================================
// PageMinder - AddMemoButton Component
// =============================================================================

import { IconAdd } from '@/components/icons';

interface AddMemoButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

/**
 * 新規メモ作成ボタン
 */
export function AddMemoButton({ onClick, disabled = false }: AddMemoButtonProps) {
    return (
        <button
            className="add-memo-button"
            onClick={onClick}
            disabled={disabled}
        >
            <IconAdd size={20} color="currentColor" />
            <span className="add-memo-button-text">新規メモを追加</span>
        </button>
    );
}

export default AddMemoButton;
