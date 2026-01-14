// =============================================================================
// PageMinder - Core Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Memo Types
// -----------------------------------------------------------------------------

/**
 * メモの基本構造
 */
export interface Memo {
    id: string;                          // UUID
    title?: string;                      // タイトル（optional）
    content: string;                     // 本文（Markdown対応）
    fontSize?: number;                   // フォントサイズ（px）
    backgroundColor?: string;            // 背景色（hex）
    textColor?: string;                  // 文字色（hex）

    // 表示条件
    urlPatterns: UrlPattern[];           // 表示するページのURLパターン

    // 位置・サイズ（URLパターンごとに独立設定可能）
    positions: Record<string, MemoPosition>;

    // 状態
    minimized: boolean;                  // 最小化状態

    // アクティブ化設定（optional）
    activation?: ActivationConfig;

    // メタデータ
    createdAt: string;                   // ISO 8601
    updatedAt: string;                   // ISO 8601
}

/**
 * メモの位置・サイズ情報
 */
export interface MemoPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    pinned: boolean;                     // true: absolute, false: fixed
}

/**
 * 新規メモ作成時の入力データ
 */
export type CreateMemoInput = Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * メモ更新時の入力データ
 */
export type UpdateMemoInput = Partial<Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>>;

// -----------------------------------------------------------------------------
// URL Pattern Types
// -----------------------------------------------------------------------------

/**
 * URLパターンのタイプ
 */
export type UrlPatternType = 'wildcard' | 'regex';

/**
 * URLパターン設定
 */
export interface UrlPattern {
    id: string;
    type: UrlPatternType;
    pattern: string;
    description?: string;                // ユーザー向け説明
}

// -----------------------------------------------------------------------------
// Activation Types
// -----------------------------------------------------------------------------

/**
 * アクティブ化のトリガー種別
 */
export type ActivationTrigger = 'hover' | 'click' | 'focus' | 'info-icon';

/**
 * 表示位置モード
 */
export type PositionMode = 'near-element' | 'fixed-position';

/**
 * アクティブ化設定
 */
export interface ActivationConfig {
    enabled: boolean;
    trigger: ActivationTrigger;
    selector: string;                    // CSSセレクタ
    delay?: number;                      // hover時の遅延（ms）

    // 表示位置
    positionMode: PositionMode;
    offsetX?: number;                    // 要素からのオフセット
    offsetY?: number;

    // 強調表示
    highlightElement?: boolean;          // トリガー時に要素をハイライト
    highlightColor?: string;             // ハイライト色
}

// -----------------------------------------------------------------------------
// Settings Types
// -----------------------------------------------------------------------------

/**
 * ログレベル
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * グローバル設定
 */
export interface GlobalSettings {
    defaultFontSize: number;             // デフォルト: 14
    defaultBackgroundColor: string;      // デフォルト: '#FFFFA5'
    defaultTextColor: string;            // デフォルト: '#333333'
    colorPalette: string[];              // パステルカラーパレット
    logLevel: LogLevel;
    enableHistory: boolean;              // 履歴機能の有効/無効
}

// -----------------------------------------------------------------------------
// Storage Types
// -----------------------------------------------------------------------------

/**
 * ストレージスキーマ
 */
export interface StorageSchema {
    memos: Memo[];
    settings: GlobalSettings;
    urlPatternPresets: UrlPattern[];     // よく使うパターンのプリセット
}

/**
 * ストレージのキー
 */
export type StorageKey = keyof StorageSchema;

// -----------------------------------------------------------------------------
// Import/Export Types
// -----------------------------------------------------------------------------

/**
 * インポート時のモード
 */
export type ImportMode = 'merge' | 'overwrite';

/**
 * エクスポートデータ
 */
export interface ExportData {
    version: string;                     // エクスポート形式のバージョン
    exportedAt: string;                  // ISO 8601
    data: StorageSchema;
}

/**
 * インポート結果
 */
export interface ImportResult {
    success: boolean;
    memosImported: number;
    errors: string[];
}

// -----------------------------------------------------------------------------
// UI State Types
// -----------------------------------------------------------------------------

/**
 * メモの編集状態
 */
export type MemoEditState = 'viewing' | 'editing';

/**
 * モーダルの種類
 */
export type ModalType = 'settings' | 'url-pattern' | 'activation' | 'confirm-delete' | null;

// -----------------------------------------------------------------------------
// Event Types
// -----------------------------------------------------------------------------

/**
 * メッセージアクション（Background ↔ Content Script間通信）
 */
export type MessageAction =
    | 'GET_MEMOS'
    | 'SAVE_MEMO'
    | 'DELETE_MEMO'
    | 'GET_SETTINGS'
    | 'SAVE_SETTINGS'
    | 'GET_CURRENT_URL'
    | 'START_ELEMENT_PICKER'
    | 'ELEMENT_PICKED';

/**
 * メッセージ構造
 */
export interface Message<T = unknown> {
    action: MessageAction;
    payload?: T;
}

/**
 * メッセージレスポンス
 */
export interface MessageResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}
