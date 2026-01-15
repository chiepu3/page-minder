// =============================================================================
// PageMinder - Confirm Dialog Component
// =============================================================================

import { GlobalSettings } from '@/types';
import { THEMES } from '@/lib/constants';
import { IconWarning, IconDelete } from '@/components/icons';

interface ConfirmDialogProps {
  settings: GlobalSettings;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

/**
 * 確認ダイアログコンポーネント
 * モーダルとして表示され、ユーザーにアクションの確認を求める
 */
export function ConfirmDialog({
  settings,
  title,
  message,
  confirmText = '削除',
  cancelText = 'キャンセル',
  onConfirm,
  onCancel,
  isDanger = true,
}: ConfirmDialogProps) {
  const theme = THEMES[settings.theme === 'system' ? 'dark' : settings.theme];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          backgroundColor: theme.bg,
          borderRadius: '12px',
          padding: '20px',
          minWidth: '280px',
          maxWidth: '360px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isDanger ? `${theme.danger}20` : `${theme.accent}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDanger ? (
              <IconWarning size={24} color={theme.danger} />
            ) : (
              <IconDelete size={24} color={theme.accent} />
            )}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: theme.text,
            }}
          >
            {title}
          </h3>
        </div>

        {/* メッセージ */}
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: theme.textSecondary,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        {/* ボタン */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: `1px solid ${theme.border}`,
              backgroundColor: 'transparent',
              color: theme.text,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isDanger ? theme.danger : theme.accent,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
