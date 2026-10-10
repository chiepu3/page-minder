import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from '@/components/options/SettingsPanel';
import { SettingsModal } from '@/components/memo/SettingsModal';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { useActivation } from '@/hooks/useActivation';
import type { GlobalSettings, Memo } from '@/types';

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

const timings = [
    { key: 'activationShowDelay', index: 0, fallback: 500 },
    { key: 'activationHideGracePeriod', index: 1, fallback: 300 },
] as const;

function getTimingInputs(): HTMLElement[] {
    const section = screen.getByText('アクティブ化設定').closest('section');
    if (!section) throw new Error('Timing settings section is missing');
    return within(section).getAllByRole('spinbutton');
}

function createMemo(): Memo {
    return {
        id: 'synthetic-delay-memo', content: 'Synthetic memo', urlPatterns: [], positions: {}, minimized: false,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
        activation: { enabled: true, selector: '#delay-trigger', trigger: 'hover', positionMode: 'near-element', hideCondition: 'trigger-end', delay: 1500 },
    };
}

describe('global activation timing settings', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('IntersectionObserver', class {
            observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn();
        });
    });
    afterEach(() => { cleanup(); document.body.innerHTML = ''; vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

    it.each(timings)('saves 0 ms for $key instead of replacing it with a default', ({ key, index }) => {
        const onSave = vi.fn<(settings: GlobalSettings) => void>();
        render(<SettingsPanel settings={DEFAULT_SETTINGS} onSave={onSave} />);
        fireEvent.change(getTimingInputs()[index], { target: { value: '0' } });
        fireEvent.click(screen.getByRole('button', { name: /設定を保存/ }));
        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onSave.mock.calls[0][0]).toEqual({ ...DEFAULT_SETTINGS, [key]: 0 });
    });

    it.each(timings)('preserves a nonzero value for $key', ({ key, index }) => {
        const onSave = vi.fn<(settings: GlobalSettings) => void>();
        render(<SettingsPanel settings={DEFAULT_SETTINGS} onSave={onSave} />);
        fireEvent.change(getTimingInputs()[index], { target: { value: '1200' } });
        fireEvent.click(screen.getByRole('button', { name: /設定を保存/ }));
        expect(onSave.mock.calls[0][0][key]).toBe(1200);
    });

    it.each(timings)('keeps the existing blank-input fallback for $key', ({ key, index, fallback }) => {
        const onSave = vi.fn<(settings: GlobalSettings) => void>();
        render(<SettingsPanel settings={DEFAULT_SETTINGS} onSave={onSave} />);
        fireEvent.change(getTimingInputs()[index], { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /設定を保存/ }));
        expect(onSave.mock.calls[0][0][key]).toBe(fallback);
    });

    it('shows the effective global delay without erasing a legacy memo delay on save', () => {
        const memo = createMemo();
        const onUpdate = vi.fn<(updated: Memo) => void>();
        render(<SettingsModal memo={memo} settings={{ ...DEFAULT_SETTINGS, activationShowDelay: 250 }} onUpdate={onUpdate} onClose={vi.fn()} initialTab="activation" />);
        expect(screen.getByText('表示遅延（全体設定）')).toBeInTheDocument();
        expect(screen.getByText('現在の設定: 250 ms')).toBeInTheDocument();
        expect(screen.queryByText('表示遅延 (ms)')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: '設定を保存' }));
        expect(onUpdate.mock.calls[0][0].activation).toEqual(memo.activation);
        expect(onUpdate.mock.calls[0][0].activation?.delay).toBe(1500);
    });

    it('cancels the memo dialog without changing legacy activation data', () => {
        const memo = createMemo();
        const before = JSON.stringify(memo);
        const onUpdate = vi.fn(); const onClose = vi.fn();
        render(<SettingsModal memo={memo} settings={DEFAULT_SETTINGS} onUpdate={onUpdate} onClose={onClose} initialTab="activation" />);
        fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onUpdate).not.toHaveBeenCalled();
        expect(JSON.stringify(memo)).toBe(before);
    });

    it('applies saved global zero delays even when the memo retains a legacy delay', () => {
        const onSave = vi.fn<(settings: GlobalSettings) => void>();
        const panel = render(<SettingsPanel settings={DEFAULT_SETTINGS} onSave={onSave} />);
        for (const input of getTimingInputs()) fireEvent.change(input, { target: { value: '0' } });
        fireEvent.click(screen.getByRole('button', { name: /設定を保存/ }));
        const settings = onSave.mock.calls[0][0];
        panel.unmount();
        const trigger = document.createElement('button');
        trigger.id = 'delay-trigger'; document.body.appendChild(trigger);
        const onActivate = vi.fn(); const onDeactivate = vi.fn();
        renderHook(() => useActivation([createMemo()], { settings, onActivate, onDeactivate }));
        fireEvent.mouseEnter(trigger);
        act(() => vi.advanceTimersByTime(0));
        expect(onActivate).toHaveBeenCalledTimes(1);
        fireEvent.mouseLeave(trigger);
        act(() => vi.advanceTimersByTime(0));
        expect(onDeactivate).toHaveBeenCalledTimes(1);
    });
});
