// =============================================================================
// PageMinder - Storage Utility
// =============================================================================

import type { Memo, GlobalSettings, StorageSchema, UrlPattern, StorageKey } from '@/types';
import { DEFAULT_SETTINGS } from './constants';
import { logger } from './logger';

// -----------------------------------------------------------------------------
// Storage Class
// -----------------------------------------------------------------------------

/**
 * chrome.storage.local のラッパークラス
 */
class Storage {
    /**
     * 指定キーの値を取得
     */
    private async get<K extends StorageKey>(
        key: K
    ): Promise<StorageSchema[K] | undefined> {
        try {
            const result = await chrome.storage.local.get(key);
            return result[key] as StorageSchema[K] | undefined;
        } catch (error) {
            logger.error('Storage get failed', { key, error: String(error) });
            throw error;
        }
    }

    /**
     * 指定キーに値を設定
     */
    private async set<K extends StorageKey>(
        key: K,
        value: StorageSchema[K]
    ): Promise<void> {
        try {
            await chrome.storage.local.set({ [key]: value });
            logger.debug('Storage set', { key });
        } catch (error) {
            logger.error('Storage set failed', { key, error: String(error) });
            throw error;
        }
    }

    // ---------------------------------------------------------------------------
    // Memo CRUD
    // ---------------------------------------------------------------------------

    /**
     * 全メモを取得
     */
    async getMemos(): Promise<Memo[]> {
        const memos = await this.get('memos');
        return memos ?? [];
    }

    /**
     * 特定のメモを取得
     */
    async getMemo(memoId: string): Promise<Memo | undefined> {
        const memos = await this.getMemos();
        return memos.find((m) => m.id === memoId);
    }

    /**
     * メモを保存（作成または更新）
     */
    async saveMemo(memo: Memo): Promise<void> {
        const memos = await this.getMemos();
        const index = memos.findIndex((m) => m.id === memo.id);
        const now = new Date().toISOString();

        if (index >= 0) {
            // 更新
            memos[index] = { ...memo, updatedAt: now };
            logger.info('Memo updated', { memoId: memo.id });
        } else {
            // 新規作成
            memos.push({
                ...memo,
                createdAt: now,
                updatedAt: now,
            });
            logger.info('Memo created', { memoId: memo.id });
        }

        await this.set('memos', memos);
    }

    /**
     * メモを削除
     */
    async deleteMemo(memoId: string): Promise<void> {
        const memos = await this.getMemos();
        const filtered = memos.filter((m) => m.id !== memoId);

        if (filtered.length === memos.length) {
            logger.warn('Memo not found for deletion', { memoId });
            return;
        }

        await this.set('memos', filtered);
        logger.info('Memo deleted', { memoId });
    }

    /**
     * 指定URLにマッチするメモを取得
     */
    async getMemosForUrl(url: string): Promise<Memo[]> {
        const memos = await this.getMemos();
        // URLマッチングは url-matcher を使用
        // ここでは import の循環を避けるため、呼び出し側でフィルタリングする
        return memos;
    }

    // ---------------------------------------------------------------------------
    // Settings
    // ---------------------------------------------------------------------------

    /**
     * 設定を取得
     */
    async getSettings(): Promise<GlobalSettings> {
        const settings = await this.get('settings');
        return settings ?? DEFAULT_SETTINGS;
    }

    /**
     * 設定を保存
     */
    async saveSettings(settings: GlobalSettings): Promise<void> {
        await this.set('settings', settings);
        logger.info('Settings saved');
    }

    /**
     * 設定を部分更新
     */
    async updateSettings(partial: Partial<GlobalSettings>): Promise<void> {
        const current = await this.getSettings();
        const updated = { ...current, ...partial };
        await this.saveSettings(updated);
    }

    // ---------------------------------------------------------------------------
    // URL Pattern Presets
    // ---------------------------------------------------------------------------

    /**
     * URLパターンプリセットを取得
     */
    async getUrlPatternPresets(): Promise<UrlPattern[]> {
        const presets = await this.get('urlPatternPresets');
        return presets ?? [];
    }

    /**
     * URLパターンプリセットを保存
     */
    async saveUrlPatternPresets(presets: UrlPattern[]): Promise<void> {
        await this.set('urlPatternPresets', presets);
        logger.info('URL pattern presets saved', { count: presets.length });
    }

    // ---------------------------------------------------------------------------
    // Export/Import
    // ---------------------------------------------------------------------------

    /**
     * 全データをエクスポート
     */
    async exportAll(): Promise<StorageSchema> {
        const memos = await this.getMemos();
        const settings = await this.getSettings();
        const urlPatternPresets = await this.getUrlPatternPresets();
        return { memos, settings, urlPatternPresets };
    }

    /**
     * データをインポート（上書き）
     */
    async importAll(data: StorageSchema): Promise<void> {
        await this.set('memos', data.memos);
        await this.set('settings', data.settings);
        await this.set('urlPatternPresets', data.urlPatternPresets);
        logger.info('Data imported', { memoCount: data.memos.length });
    }

    /**
     * データをマージインポート
     */
    async importMerge(data: StorageSchema): Promise<number> {
        const existingMemos = await this.getMemos();
        const existingIds = new Set(existingMemos.map((m) => m.id));

        // 重複しないメモのみ追加
        const newMemos = data.memos.filter((m) => !existingIds.has(m.id));
        const mergedMemos = [...existingMemos, ...newMemos];

        await this.set('memos', mergedMemos);

        // プリセットもマージ
        const existingPresets = await this.getUrlPatternPresets();
        const existingPresetIds = new Set(existingPresets.map((p) => p.id));
        const newPresets = data.urlPatternPresets.filter((p) => !existingPresetIds.has(p.id));
        const mergedPresets = [...existingPresets, ...newPresets];

        await this.set('urlPatternPresets', mergedPresets);

        logger.info('Data merged', { newMemos: newMemos.length, newPresets: newPresets.length });
        return newMemos.length;
    }

    // ---------------------------------------------------------------------------
    // Utility
    // ---------------------------------------------------------------------------

    /**
     * 全データをクリア
     */
    async clear(): Promise<void> {
        await chrome.storage.local.clear();
        logger.warn('All storage cleared');
    }
}

// -----------------------------------------------------------------------------
// Singleton Export
// -----------------------------------------------------------------------------

/**
 * ストレージのシングルトンインスタンス
 */
export const storage = new Storage();
