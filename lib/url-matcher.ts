// =============================================================================
// PageMinder - URL Matcher Utility
// =============================================================================

import type { UrlPattern, UrlPatternType } from '@/types';

// -----------------------------------------------------------------------------
// Match Functions
// -----------------------------------------------------------------------------

/**
 * ワイルドカードパターンをURLにマッチ
 * @param url - テスト対象のURL
 * @param pattern - ワイルドカードパターン（* は任意の文字列にマッチ）
 * @returns マッチした場合 true
 */
export function matchWildcard(url: string, pattern: string): boolean {
    // ワイルドカードを正規表現に変換
    // * → .* に変換し、他の特殊文字はエスケープ
    const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // 特殊文字をエスケープ
        .replace(/\*/g, '.*');                   // * を .* に変換

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
}

/**
 * 正規表現パターンをURLにマッチ
 * @param url - テスト対象のURL
 * @param pattern - 正規表現パターン文字列
 * @returns マッチした場合 true
 */
export function matchRegex(url: string, pattern: string): boolean {
    try {
        const regex = new RegExp(pattern);
        return regex.test(url);
    } catch {
        // 無効な正規表現の場合は false を返す
        return false;
    }
}

/**
 * URLパターン設定に基づいてURLをマッチ
 * @param url - テスト対象のURL
 * @param pattern - URLパターン設定
 * @returns マッチした場合 true
 */
export function matchUrlPattern(url: string, pattern: UrlPattern): boolean {
    if (pattern.type === 'wildcard') {
        return matchWildcard(url, pattern.pattern);
    }
    return matchRegex(url, pattern.pattern);
}

/**
 * 複数のURLパターンのいずれかにマッチするか確認
 * @param url - テスト対象のURL
 * @param patterns - URLパターン設定の配列
 * @returns マッチした場合 true
 */
export function matchAnyUrlPattern(url: string, patterns: UrlPattern[]): boolean {
    return patterns.some((pattern) => matchUrlPattern(url, pattern));
}

/**
 * マッチしたパターンを全て取得
 * @param url - テスト対象のURL
 * @param patterns - URLパターン設定の配列
 * @returns マッチしたパターンの配列
 */
export function findMatchingPatterns(url: string, patterns: UrlPattern[]): UrlPattern[] {
    return patterns.filter((pattern) => matchUrlPattern(url, pattern));
}

// -----------------------------------------------------------------------------
// Validation Functions
// -----------------------------------------------------------------------------

/**
 * 正規表現パターンが有効か検証
 * @param pattern - 正規表現パターン文字列
 * @returns 有効な場合 true
 */
export function isValidRegex(pattern: string): boolean {
    try {
        new RegExp(pattern);
        return true;
    } catch {
        return false;
    }
}

/**
 * URLパターンが有効か検証
 * @param pattern - URLパターン設定
 * @returns 有効な場合 true
 */
export function isValidUrlPattern(pattern: UrlPattern): boolean {
    if (!pattern.pattern || pattern.pattern.trim() === '') {
        return false;
    }

    if (pattern.type === 'regex') {
        return isValidRegex(pattern.pattern);
    }

    // ワイルドカードパターンは基本的に常に有効
    return true;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * パターンタイプを推測
 * @param pattern - パターン文字列
 * @returns 推測されたパターンタイプ
 */
export function inferPatternType(pattern: string): UrlPatternType {
    // 正規表現特有の文字が含まれていればregexと推測
    const regexChars = /[\^$+?{}()|[\]\\]/;
    if (regexChars.test(pattern)) {
        return 'regex';
    }
    return 'wildcard';
}

/**
 * 現在のURLからパターンを生成
 * @param url - 現在のURL
 * @returns 生成されたワイルドカードパターン
 */
export function generatePatternFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        // パス部分を * に置き換える候補を生成
        const pathParts = urlObj.pathname.split('/').filter(Boolean);

        if (pathParts.length === 0) {
            return `${urlObj.origin}/*`;
        }

        // 最後のパス部分を * に置き換え
        const wildcardPath = [...pathParts.slice(0, -1), '*'].join('/');
        return `${urlObj.origin}/${wildcardPath}`;
    } catch {
        return url;
    }
}
