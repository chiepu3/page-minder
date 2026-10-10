import { act, cleanup, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { GlobalSettings, Memo } from '@/types';
import { useActivation } from './useActivation';

vi.mock('@/lib/logger', () => ({
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

function createMemo(id: string, selector = '.trigger'): Memo {
    return {
        id,
        content: 'Synthetic test memo',
        urlPatterns: [],
        positions: {},
        minimized: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        activation: {
            enabled: true,
            trigger: 'click',
            selector,
            positionMode: 'near-element',
            hideCondition: 'manual',
        },
    };
}

function createOptions(): {
    onActivate: ReturnType<typeof vi.fn>;
    onDeactivate: ReturnType<typeof vi.fn>;
    settings: GlobalSettings;
} {
    return {
        onActivate: vi.fn(),
        onDeactivate: vi.fn(),
        settings: { ...DEFAULT_SETTINGS },
    };
}

describe('useActivation shared trigger registration', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('IntersectionObserver', class {
            observe = vi.fn();
            unobserve = vi.fn();
            disconnect = vi.fn();
        });
        document.body.innerHTML = '<button class="trigger" id="shared"><span>Trigger</span></button>';
    });

    afterEach(() => {
        cleanup();
        document.body.innerHTML = '';
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('does not duplicate overlapping selectors that match the same element', () => {
        const options = createOptions();
        renderHook(() => useActivation([createMemo('first', '.trigger'), createMemo('second', '#shared')], options));
        act(() => vi.advanceTimersByTime(3500));
        fireEvent.click(document.querySelector('#shared')!);
        expect(options.onActivate).toHaveBeenCalledTimes(2);
        expect(options.onDeactivate).not.toHaveBeenCalled();
    });

    it.each(['hover', 'focus'] as const)('registers shared %s triggers only once per memo', (trigger) => {
        const options = createOptions();
        const memos = [createMemo('first'), createMemo('second')].map(memo => ({
            ...memo,
            activation: { ...memo.activation!, trigger },
        }));
        renderHook(() => useActivation(memos, options));
        act(() => vi.advanceTimersByTime(3500));
        const element = document.querySelector('#shared')!;
        if (trigger === 'hover') {
            fireEvent.mouseEnter(element);
            act(() => vi.advanceTimersByTime(DEFAULT_SETTINGS.activationShowDelay));
        } else {
            fireEvent.focusIn(element);
        }
        expect(options.onActivate).toHaveBeenCalledTimes(2);
        expect(options.onDeactivate).not.toHaveBeenCalled();
    });

    it.each(['hover', 'focus'] as const)('applies zero timing to both shared %s memos after rescans', (trigger) => {
        const options = createOptions();
        options.settings.activationShowDelay = 0;
        options.settings.activationHideGracePeriod = 0;
        const memos = [createMemo('first'), createMemo('second')].map(memo => ({
            ...memo,
            activation: { ...memo.activation!, trigger, hideCondition: 'trigger-end' as const },
        }));
        const { result } = renderHook(() => useActivation(memos, options));
        act(() => vi.advanceTimersByTime(3500));
        const element = document.querySelector('#shared')!;
        if (trigger === 'hover') fireEvent.mouseEnter(element);
        else fireEvent.focusIn(element);
        act(() => vi.advanceTimersByTime(0));
        expect(options.onActivate).toHaveBeenCalledTimes(2);
        expect(result.current.isActive('first')).toBe(true);
        expect(result.current.isActive('second')).toBe(true);
        if (trigger === 'hover') fireEvent.mouseLeave(element);
        else fireEvent.focusOut(element);
        act(() => vi.advanceTimersByTime(0));
        expect(options.onDeactivate).toHaveBeenCalledTimes(2);
        expect(result.current.isActive('first')).toBe(false);
        expect(result.current.isActive('second')).toBe(false);
    });

    it('does not duplicate listeners when a registered element is moved in the DOM', async () => {
        const options = createOptions();
        renderHook(() => useActivation([createMemo('first'), createMemo('second')], options));
        const element = document.querySelector('#shared')!;
        await act(async () => {
            const wrapper = document.createElement('section');
            document.body.appendChild(wrapper);
            wrapper.appendChild(element);
            await Promise.resolve();
        });
        act(() => vi.advanceTimersByTime(100));
        fireEvent.click(element);
        expect(options.onActivate).toHaveBeenCalledTimes(2);
        expect(options.onDeactivate).not.toHaveBeenCalled();
    });

    it('still registers both memos on a newly inserted matching element', async () => {
        const options = createOptions();
        renderHook(() => useActivation([createMemo('first'), createMemo('second')], options));
        const element = document.createElement('button');
        element.className = 'trigger';
        await act(async () => {
            document.body.appendChild(element);
            await Promise.resolve();
        });
        act(() => vi.advanceTimersByTime(100));
        fireEvent.click(element);
        expect(options.onActivate).toHaveBeenCalledTimes(2);
        expect(options.onActivate).toHaveBeenCalledWith('first', element);
        expect(options.onActivate).toHaveBeenCalledWith('second', element);
    });

    it('replaces registrations when one memo is removed and leaves no listeners after unmount', () => {
        const options = createOptions();
        const first = createMemo('first');
        const { rerender, unmount } = renderHook(
            ({ memos }: { memos: Memo[] }) => useActivation(memos, options),
            { initialProps: { memos: [first, createMemo('second')] } },
        );
        act(() => vi.advanceTimersByTime(3500));
        rerender({ memos: [first] });
        fireEvent.click(document.querySelector('#shared')!);
        expect(options.onActivate).toHaveBeenCalledTimes(1);
        expect(options.onActivate).toHaveBeenCalledWith('first', document.querySelector('#shared'));
        unmount();
        options.onActivate.mockClear();
        options.onDeactivate.mockClear();
        act(() => vi.advanceTimersByTime(3500));
        fireEvent.click(document.querySelector('#shared')!);
        expect(options.onActivate).not.toHaveBeenCalled();
        expect(options.onDeactivate).not.toHaveBeenCalled();
    });

    it('does not duplicate two memos sharing one selector during delayed rescans', () => {
        const options = createOptions();
        const { result } = renderHook(() => useActivation([createMemo('first'), createMemo('second')], options));
        act(() => vi.advanceTimersByTime(3500));
        fireEvent.click(document.querySelector('#shared span')!);

        expect(options.onActivate).toHaveBeenCalledTimes(2);
        expect(options.onActivate).toHaveBeenCalledWith('first', document.querySelector('#shared'));
        expect(options.onActivate).toHaveBeenCalledWith('second', document.querySelector('#shared'));
        expect(options.onDeactivate).not.toHaveBeenCalled();
        expect(result.current.isActive('first')).toBe(true);
        expect(result.current.isActive('second')).toBe(true);

        fireEvent.click(document.querySelector('#shared span')!);
        expect(options.onDeactivate).toHaveBeenCalledTimes(2);
        expect(result.current.isActive('first')).toBe(false);
        expect(result.current.isActive('second')).toBe(false);
    });
});
