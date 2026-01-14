// =============================================================================
// PageMinder - Logger Utility
// =============================================================================

import type { LogLevel } from '@/types';

// -----------------------------------------------------------------------------
// Log Level Priorities
// -----------------------------------------------------------------------------

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// -----------------------------------------------------------------------------
// Logger Class
// -----------------------------------------------------------------------------

/**
 * 構造化ロギングユーティリティ
 */
class Logger {
    private minLevel: LogLevel = 'info';
    private readonly prefix = '[PageMinder]';

    /**
     * ログレベルを設定
     */
    setLevel(level: LogLevel): void {
        this.minLevel = level;
    }

    /**
     * 現在のログレベルを取得
     */
    getLevel(): LogLevel {
        return this.minLevel;
    }

    /**
     * 指定レベルのログを出力すべきか判定
     */
    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
    }

    /**
     * ログメッセージをフォーマット
     */
    private formatMessage(level: string, message: string): string {
        const timestamp = new Date().toISOString();
        return `${this.prefix}[${level.toUpperCase()}][${timestamp}] ${message}`;
    }

    /**
     * デバッグログ
     */
    debug(message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog('debug')) {
            const formattedMessage = this.formatMessage('debug', message);
            if (data !== undefined) {
                console.debug(formattedMessage, data);
            } else {
                console.debug(formattedMessage);
            }
        }
    }

    /**
     * 情報ログ
     */
    info(message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog('info')) {
            const formattedMessage = this.formatMessage('info', message);
            if (data !== undefined) {
                console.info(formattedMessage, data);
            } else {
                console.info(formattedMessage);
            }
        }
    }

    /**
     * 警告ログ
     */
    warn(message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog('warn')) {
            const formattedMessage = this.formatMessage('warn', message);
            if (data !== undefined) {
                console.warn(formattedMessage, data);
            } else {
                console.warn(formattedMessage);
            }
        }
    }

    /**
     * エラーログ
     */
    error(message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog('error')) {
            const formattedMessage = this.formatMessage('error', message);
            if (data !== undefined) {
                console.error(formattedMessage, data);
            } else {
                console.error(formattedMessage);
            }
        }
    }
}

// -----------------------------------------------------------------------------
// Singleton Export
// -----------------------------------------------------------------------------

/**
 * ロガーのシングルトンインスタンス
 */
export const logger = new Logger();
