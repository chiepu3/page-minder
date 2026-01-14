// =============================================================================
// PageMinder - Constants and Default Values
// =============================================================================

import type { GlobalSettings } from '@/types';

// -----------------------------------------------------------------------------
// Pastel Color Palette
// -----------------------------------------------------------------------------

/**
 * 付箋風パステルカラーパレット
 */
export const PASTEL_COLORS = {
    yellow: '#FFFFA5',   // 黄色（標準付箋）
    pink: '#FFD6E0',     // ピンク
    blue: '#D6EAFF',     // 水色
    green: '#D6FFD6',    // 緑
    orange: '#FFE4C4',   // オレンジ
    purple: '#E8D6FF',   // 紫
    mint: '#D6FFF0',     // ミント
    peach: '#FFDAB9',    // ピーチ
} as const;

/**
 * カラーパレットの配列形式
 */
export const COLOR_PALETTE = Object.values(PASTEL_COLORS);

// -----------------------------------------------------------------------------
// Default Settings
// -----------------------------------------------------------------------------

/**
 * デフォルトのグローバル設定
 */
export const DEFAULT_SETTINGS: GlobalSettings = {
    defaultFontSize: 14,
    defaultBackgroundColor: PASTEL_COLORS.yellow,
    defaultTextColor: '#333333',
    colorPalette: COLOR_PALETTE,
    logLevel: 'info',
    enableHistory: false,
};

// -----------------------------------------------------------------------------
// Memo Defaults
// -----------------------------------------------------------------------------

/**
 * 新規メモのデフォルトサイズ
 */
export const DEFAULT_MEMO_SIZE = {
    width: 300,
    height: 200,
};

/**
 * 最小化時のサイズ
 */
export const MINIMIZED_SIZE = {
    width: 32,
    height: 32,
};

/**
 * メモの最小サイズ
 */
export const MIN_MEMO_SIZE = {
    width: 150,
    height: 100,
};

/**
 * メモの最大サイズ
 */
export const MAX_MEMO_SIZE = {
    width: 800,
    height: 600,
};

// -----------------------------------------------------------------------------
// Activation Defaults
// -----------------------------------------------------------------------------

/**
 * ホバー遅延のデフォルト値（ms）
 */
export const DEFAULT_HOVER_DELAY = 500;

/**
 * ハイライトのデフォルト色
 */
export const DEFAULT_HIGHLIGHT_COLOR = 'rgba(255, 200, 0, 0.3)';

// -----------------------------------------------------------------------------
// UI Constants
// -----------------------------------------------------------------------------

/**
 * アニメーション時間（ms）
 */
export const ANIMATION_DURATION = 200;

/**
 * Shadow DOMのコンテナ名
 */
export const SHADOW_ROOT_NAME = 'pageminder-container';

// -----------------------------------------------------------------------------
// Storage Keys
// -----------------------------------------------------------------------------

/**
 * ストレージキー
 */
export const STORAGE_KEYS = {
    MEMOS: 'memos',
    SETTINGS: 'settings',
    URL_PATTERN_PRESETS: 'urlPatternPresets',
} as const;

// -----------------------------------------------------------------------------
// Export Data Version
// -----------------------------------------------------------------------------

/**
 * エクスポートデータのバージョン
 */
export const EXPORT_VERSION = '1.0.0';
