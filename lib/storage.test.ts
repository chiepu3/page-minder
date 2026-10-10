import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { Memo } from '@/types';

const chromeApi = vi.hoisted(() => ({ storage: { local: { get: vi.fn(), set: vi.fn() } } }));
vi.mock('wxt/browser', () => ({ browser: chromeApi }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const memo: Memo = {
    id: 'synthetic-deleted-memo', content: 'Synthetic test data', urlPatterns: [],
    positions: {}, minimized: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};
type StoredMemos = { memos: Memo[] };
function copy<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }

describe('pending write after deletion', () => {
    let stored: StoredMemos;

    function pauseNextRead(): () => void {
        const initial = copy(stored);
        let resolveRead: (data: StoredMemos) => void = () => undefined;
        const slowRead = new Promise<StoredMemos>(resolve => { resolveRead = resolve; });
        chromeApi.storage.local.get.mockImplementationOnce(() => slowRead);
        return () => resolveRead(initial);
    }

    beforeEach(() => {
        vi.useFakeTimers();
        vi.resetModules();
        stored = { memos: [copy(memo)] };
        chromeApi.storage.local.get.mockReset().mockImplementation(async () => copy(stored));
        chromeApi.storage.local.set.mockReset().mockImplementation(async (data: StoredMemos) => { stored = copy(data); });
        // Keep one API object for both raw Chrome and WXT's imported API reference.
        vi.stubGlobal('chrome', chromeApi);
    });
    afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

    it('does not recreate a deleted memo when a previously started batch read completes late', async () => {
        const { storage } = await import('./storage');
        const finishRead = pauseNextRead();
        await storage.saveMemo({ ...memo, content: 'Pending synthetic edit' });
        await vi.advanceTimersByTimeAsync(500);
        const deletion = storage.deleteMemo(memo.id);
        await vi.advanceTimersByTimeAsync(0);
        finishRead();
        await deletion;
        await vi.advanceTimersByTimeAsync(0);
        expect(stored.memos).toEqual([]);
    });

    it('keeps pending writes for other memos', async () => {
        const { storage } = await import('./storage');
        const other = { ...memo, id: 'other-synthetic-memo', content: 'Other original value' };
        stored.memos.push(copy(other));
        await storage.saveMemo({ ...memo, content: 'Edit to cancel' });
        await storage.saveMemo({ ...other, content: 'Other pending new value' });
        await storage.deleteMemo(memo.id);
        await vi.advanceTimersByTimeAsync(500);
        expect(stored.memos.map(item => item.id)).toEqual([other.id]);
        expect(stored.memos[0].content).toBe('Other pending new value');
    });

    it('cancels a pending new memo that is not yet persisted', async () => {
        const { storage } = await import('./storage');
        stored.memos = [];
        await storage.saveMemo(memo);
        await storage.deleteMemo(memo.id);
        await vi.advanceTimersByTimeAsync(500);
        expect(stored.memos).toEqual([]);
    });

    it('can schedule a new save after cancelling the last pending timer', async () => {
        const { storage } = await import('./storage');
        await storage.saveMemo(memo);
        await storage.deleteMemo(memo.id);
        const next = { ...memo, id: 'new-synthetic-memo' };
        await storage.saveMemo(next);
        await vi.advanceTimersByTimeAsync(500);
        expect(stored.memos.map(item => item.id)).toEqual([next.id]);
    });

    it('allows an explicit new save after deletion has completed', async () => {
        const { storage } = await import('./storage');
        await storage.deleteMemo(memo.id);
        await storage.saveMemo({ ...memo, content: 'Intentional new save' });
        await vi.advanceTimersByTimeAsync(500);
        expect(stored.memos[0].content).toBe('Intentional new save');
    });

    it('retains the pending edit when deletion fails', async () => {
        const { storage } = await import('./storage');
        chromeApi.storage.local.set.mockRejectedValueOnce(new Error('Synthetic write failure'));
        await storage.saveMemo({ ...memo, content: 'Pending edit must survive failure' });
        await expect(storage.deleteMemo(memo.id)).rejects.toThrow('Synthetic write failure');
        await vi.advanceTimersByTimeAsync(500);
        expect(stored.memos).toHaveLength(1);
        expect(stored.memos[0].content).toBe('Pending edit must survive failure');
    });

    it('keeps processing deletes after an immediate save fails', async () => {
        const { storage } = await import('./storage');
        chromeApi.storage.local.set.mockRejectedValueOnce(new Error('Synthetic save failure'));
        await expect(storage.saveMemo(memo, { immediate: true })).rejects.toThrow('Synthetic save failure');
        await storage.deleteMemo(memo.id);
        expect(stored.memos).toEqual([]);
    });

    it('serializes an in-flight immediate save before deletion', async () => {
        const { storage } = await import('./storage');
        const finishRead = pauseNextRead();
        const saving = storage.saveMemo({ ...memo, content: 'Slow immediate edit' }, { immediate: true });
        await vi.advanceTimersByTimeAsync(0);
        const deletion = storage.deleteMemo(memo.id);
        await vi.advanceTimersByTimeAsync(0);
        finishRead();
        await Promise.all([saving, deletion]);
        expect(stored.memos).toEqual([]);
    });

    it('invalidates an immediate edit requested while deletion is still in flight', async () => {
        const { storage } = await import('./storage');
        const finishRead = pauseNextRead();
        const deletion = storage.deleteMemo(memo.id);
        await vi.advanceTimersByTimeAsync(0);
        const saving = storage.saveMemo({ ...memo, content: 'Stale edit during deletion' }, { immediate: true });
        finishRead();
        await Promise.all([deletion, saving]);
        expect(stored.memos).toEqual([]);
    });

    it('invalidates an immediate edit queued behind deletion of an unpersisted memo', async () => {
        const { storage } = await import('./storage');
        stored.memos = [];
        const deletion = storage.deleteMemo(memo.id);
        const saving = storage.saveMemo(memo, { immediate: true });
        await Promise.all([deletion, saving]);
        expect(stored.memos).toEqual([]);
    });

    it('keeps an immediate edit queued behind a failed deletion', async () => {
        const { storage } = await import('./storage');
        chromeApi.storage.local.set.mockRejectedValueOnce(new Error('Synthetic deletion failure'));
        const finishRead = pauseNextRead();
        const deletion = storage.deleteMemo(memo.id);
        const failure = expect(deletion).rejects.toThrow('Synthetic deletion failure');
        await vi.advanceTimersByTimeAsync(0);
        const saving = storage.saveMemo({ ...memo, content: 'Edit survives failed deletion' }, { immediate: true });
        finishRead();
        await Promise.all([failure, saving]);
        expect(stored.memos[0].content).toBe('Edit survives failed deletion');
    });

    it('allows an explicit immediate save after deletion has completed', async () => {
        const { storage } = await import('./storage');
        await storage.deleteMemo(memo.id);
        await storage.saveMemo({ ...memo, content: 'Intentional immediate recreation' }, { immediate: true });
        expect(stored.memos[0].content).toBe('Intentional immediate recreation');
    });

    it('does not recreate a deleted memo when its drag-save timer fires', async () => {
        const { storage } = await import('./storage');
        await storage.saveMemo({ ...memo, positions: { demo: { x: 10, y: 20, width: 300, height: 200, pinned: false } } });
        await storage.deleteMemo(memo.id);
        expect(stored.memos).toEqual([]);
        await vi.advanceTimersByTimeAsync(500);
        expect(stored.memos).toEqual([]);
    });

    it('invalidates a captured batch queued behind a successful deletion', async () => {
        const { storage } = await import('./storage');
        const other = { ...memo, id: 'slow-other-memo', content: 'Other original' };
        stored.memos.push(copy(other));
        const finishRead = pauseNextRead();
        const slowSave = storage.saveMemo({ ...other, content: 'Other saved' }, { immediate: true });
        await vi.advanceTimersByTimeAsync(0);
        await storage.saveMemo({ ...memo, content: 'Pending edit to cancel' });
        const deletion = storage.deleteMemo(memo.id);
        await vi.advanceTimersByTimeAsync(500);
        finishRead();
        await Promise.all([slowSave, deletion]);
        await vi.advanceTimersByTimeAsync(0);
        expect(stored.memos.map(item => item.id)).toEqual([other.id]);
        expect(stored.memos[0].content).toBe('Other saved');
    });

    it('keeps a captured batch queued behind a failed deletion', async () => {
        const { storage } = await import('./storage');
        const other = { ...memo, id: 'slow-other-memo', content: 'Other original' };
        stored.memos.push(copy(other));
        chromeApi.storage.local.set
            .mockImplementationOnce(async (data: StoredMemos) => { stored = copy(data); })
            .mockRejectedValueOnce(new Error('Synthetic deletion failure'));
        const finishRead = pauseNextRead();
        const slowSave = storage.saveMemo({ ...other, content: 'Other saved' }, { immediate: true });
        await vi.advanceTimersByTimeAsync(0);
        await storage.saveMemo({ ...memo, content: 'Pending edit must remain' });
        const deletion = storage.deleteMemo(memo.id);
        const failure = expect(deletion).rejects.toThrow('Synthetic deletion failure');
        await vi.advanceTimersByTimeAsync(500);
        finishRead();
        await Promise.all([slowSave, failure]);
        await vi.advanceTimersByTimeAsync(0);
        expect(stored.memos.find(item => item.id === memo.id)?.content).toBe('Pending edit must remain');
        expect(stored.memos.find(item => item.id === other.id)?.content).toBe('Other saved');
    });

    it('does not let a queued batch consume edits newer than a later immediate save', async () => {
        const { storage } = await import('./storage');
        const other = { ...memo, id: 'slow-other-memo', content: 'Other original' };
        stored.memos.push(copy(other));
        const finishRead = pauseNextRead();
        const slowSave = storage.saveMemo({ ...other, content: 'Other saved' }, { immediate: true });
        await vi.advanceTimersByTimeAsync(0);
        await storage.saveMemo({ ...memo, content: 'older' });
        await vi.advanceTimersByTimeAsync(500);
        const middleSave = storage.saveMemo({ ...memo, content: 'middle' }, { immediate: true });
        await storage.saveMemo({ ...memo, content: 'newest' });
        finishRead();
        await Promise.all([slowSave, middleSave]);
        await vi.advanceTimersByTimeAsync(500);
        expect(stored.memos.find(item => item.id === memo.id)?.content).toBe('newest');
        expect(stored.memos.find(item => item.id === other.id)?.content).toBe('Other saved');
    });
});
