// =============================================================================
// PageMinder - useActivation Hook (with MutationObserver for dynamic DOM)
// =============================================================================

import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { Memo, ActivationConfig, GlobalSettings } from '@/types';
import { logger } from '@/lib/logger';

interface UseActivationOptions {
    onActivate: (memoId: string, triggerElement: Element) => void;
    onDeactivate: (memoId: string) => void;
    settings: GlobalSettings;
}

/**
 * アクティブ化トリガーを管理するカスタムフック
 * メモに設定されたセレクタとトリガーに基づいてイベントを監視
 * MutationObserverでDOMの動的変更にも対応
 */
export function useActivation(
    memos: Memo[],
    options: UseActivationOptions
) {
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const activeStatesRef = useRef<Map<string, { memoId: string; triggerElement: Element; config: ActivationConfig }>>(new Map());
    const timeoutIdsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const clickedElementsRef = useRef<Set<Element>>(new Set());
    const cleanupFunctionsRef = useRef<Array<() => void>>([]);
    const graceTimeoutIdsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    // MutationObserver用のref
    const observerRef = useRef<MutationObserver | null>(null);
    const rescanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 既にイベントリスナーを設定した要素を追跡（重複登録防止）
    const registeredElementsRef = useRef<WeakSet<Element>>(new WeakSet());

    // パフォーマンス最適化: セレクタ→メモのマッピングをキャッシュ
    const selectorMemoMapRef = useRef<Map<string, Memo[]> | null>(null);

    // メモ外クリックで非表示
    useEffect(() => {
        const handleDocumentClick = (e: MouseEvent) => {
            const target = e.target as Element;

            activeStatesRef.current.forEach((state, memoId) => {
                if (state.config.hideCondition === 'click-outside') {
                    const memoElement = document.querySelector(`[data-memo-id="${memoId}"]`);
                    if (memoElement && !memoElement.contains(target) && !state.triggerElement.contains(target)) {
                        deactivateMemoInternal(memoId);
                    }
                }
            });
        };

        document.addEventListener('click', handleDocumentClick);
        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    }, []);

    const pausedStatesRef = useRef<Map<string, Set<string>>>(new Map());

    // 内部ヘルパー関数（useCallbackではなく通常の関数として定義）
    function clearMemoTimeout(memoId: string) {
        const timeoutId = timeoutIdsRef.current.get(memoId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutIdsRef.current.delete(memoId);
        }
        // 猶予タイマーもクリア
        const graceTimeoutId = graceTimeoutIdsRef.current.get(memoId);
        if (graceTimeoutId) {
            clearTimeout(graceTimeoutId);
            graceTimeoutIdsRef.current.delete(memoId);
        }
    }

    function pauseDeactivation(memoId: string, reason: string) {
        if (!pausedStatesRef.current.has(memoId)) {
            pausedStatesRef.current.set(memoId, new Set());
        }
        pausedStatesRef.current.get(memoId)!.add(reason);

        // タイムアウト待ちならクリア（一時停止）
        clearMemoTimeout(memoId);
        logger.debug('Deactivation paused', { memoId, reason });
    }

    function resumeDeactivation(memoId: string, reason: string) {
        const reasons = pausedStatesRef.current.get(memoId);
        if (reasons) {
            reasons.delete(reason);
            if (reasons.size === 0) {
                pausedStatesRef.current.delete(memoId);
                logger.debug('Deactivation resumed', { memoId });

                // 再開時に非表示処理をトリガー
                const state = activeStatesRef.current.get(memoId);
                if (state) {
                    if (state.config.hideCondition === 'timeout') {
                        // タイムアウト条件: タイマー再開
                        setDeactivationTimeout(memoId, state.config.hideDelay ?? 5000);
                    } else if (state.config.hideCondition === 'trigger-end') {
                        // トリガー解除条件: 猶予時間後に非表示
                        const gracePeriod = optionsRef.current.settings.activationHideGracePeriod ?? 300;
                        const graceTimeoutId = setTimeout(() => {
                            graceTimeoutIdsRef.current.delete(memoId);
                            deactivateMemoInternal(memoId);
                        }, gracePeriod);
                        graceTimeoutIdsRef.current.set(memoId, graceTimeoutId);
                    }
                }
            }
        }
    }

    function deactivateMemoInternal(memoId: string) {
        // 一時停止中なら何もしない
        if (pausedStatesRef.current.has(memoId)) {
            logger.debug('Deactivation skipped (paused)', { memoId });
            return;
        }

        clearMemoTimeout(memoId);
        activeStatesRef.current.delete(memoId);
        optionsRef.current.onDeactivate(memoId);
    }

    function setDeactivationTimeout(memoId: string, delay: number) {
        clearMemoTimeout(memoId);
        const timeoutId = setTimeout(() => {
            deactivateMemoInternal(memoId);
        }, delay);
        timeoutIdsRef.current.set(memoId, timeoutId);
    }

    function activateMemoInternal(memo: Memo, triggerElement: Element, config: ActivationConfig) {
        activeStatesRef.current.set(memo.id, {
            memoId: memo.id,
            triggerElement,
            config,
        });

        logger.debug('Memo activated', { memoId: memo.id, trigger: config.trigger });
        optionsRef.current.onActivate(memo.id, triggerElement);

        // 非表示条件の設定
        if (config.hideCondition === 'timeout') {
            // ホバー中（trigger=hover）の場合、イベントリスナー側で即座に一時停止されるためここではセットしない
            // それ以外（click, focus）の場合はタイマー開始
            if (config.trigger !== 'hover') {
                setDeactivationTimeout(memo.id, config.hideDelay ?? 5000);
            }
        }
    }

    // 単一要素に対してイベントリスナーを設定する関数
    const setupListenersForElement = useCallback((memo: Memo, element: Element, config: ActivationConfig) => {
        // 既に登録済みならスキップ
        const elementKey = `${memo.id}:${config.selector}`;
        if ((element as any).__pageminder_registered === elementKey) {
            return;
        }
        (element as any).__pageminder_registered = elementKey;

        logger.debug('Setting up listeners for element', {
            memoId: memo.id,
            selector: config.selector,
            trigger: config.trigger
        });

        // hover トリガー
        if (config.trigger === 'hover') {
            let hoverTimeoutId: ReturnType<typeof setTimeout> | null = null;

            const handleMouseEnter = () => {
                // 猶予タイマーをクリア（元に戻ってきた場合）
                const graceId = graceTimeoutIdsRef.current.get(memo.id);
                if (graceId) {
                    clearTimeout(graceId);
                    graceTimeoutIdsRef.current.delete(memo.id);
                }

                const delay = optionsRef.current.settings.activationShowDelay ?? 500;
                hoverTimeoutId = setTimeout(() => {
                    activateMemoInternal(memo, element, config);
                    // timeout条件の場合、ホバー中は一時停止
                    if (config.hideCondition === 'timeout') {
                        pauseDeactivation(memo.id, 'hover-on-element');
                    }
                }, delay);
            };

            const handleMouseLeave = () => {
                if (hoverTimeoutId) {
                    clearTimeout(hoverTimeoutId);
                    hoverTimeoutId = null;
                }

                // 猶予時間後に非表示処理
                const gracePeriod = optionsRef.current.settings.activationHideGracePeriod ?? 300;
                const graceTimeoutId = setTimeout(() => {
                    graceTimeoutIdsRef.current.delete(memo.id);
                    if (config.hideCondition === 'trigger-end') {
                        deactivateMemoInternal(memo.id);
                    } else if (config.hideCondition === 'timeout') {
                        // ホバー外れたら再開
                        resumeDeactivation(memo.id, 'hover-on-element');
                    }
                }, gracePeriod);
                graceTimeoutIdsRef.current.set(memo.id, graceTimeoutId);
            };
            element.addEventListener('mouseenter', handleMouseEnter);
            element.addEventListener('mouseleave', handleMouseLeave);

            cleanupFunctionsRef.current.push(() => {
                element.removeEventListener('mouseenter', handleMouseEnter);
                element.removeEventListener('mouseleave', handleMouseLeave);
                if (hoverTimeoutId) clearTimeout(hoverTimeoutId);
                delete (element as any).__pageminder_registered;
            });
        }

        // click トリガー
        if (config.trigger === 'click') {
            // timeout条件用のホバー制御
            const handleMouseEnter = () => {
                if (config.hideCondition === 'timeout' && activeStatesRef.current.has(memo.id)) {
                    pauseDeactivation(memo.id, 'hover-on-element');
                }
            };
            const handleMouseLeave = () => {
                if (config.hideCondition === 'timeout' && activeStatesRef.current.has(memo.id)) {
                    resumeDeactivation(memo.id, 'hover-on-element');
                }
            };

            const handleClick = (e: Event) => {
                if (config.clickStopPropagation && !clickedElementsRef.current.has(element)) {
                    e.stopPropagation();
                    e.preventDefault();
                    clickedElementsRef.current.add(element);
                    setTimeout(() => clickedElementsRef.current.delete(element), 3000);
                }

                // 既にアクティブなら非表示（トグル動作）
                // ただし、一時停止中（設定画面など）は無視して常に表示維持
                if (activeStatesRef.current.has(memo.id)) {
                    if (!pausedStatesRef.current.has(memo.id)) {
                        deactivateMemoInternal(memo.id);
                    }
                } else {
                    activateMemoInternal(memo, element, config);
                }
            };

            element.addEventListener('click', handleClick, true);
            element.addEventListener('mouseenter', handleMouseEnter);
            element.addEventListener('mouseleave', handleMouseLeave);

            cleanupFunctionsRef.current.push(() => {
                element.removeEventListener('click', handleClick, true);
                element.removeEventListener('mouseenter', handleMouseEnter);
                element.removeEventListener('mouseleave', handleMouseLeave);
                delete (element as any).__pageminder_registered;
            });
        }

        // focus トリガー
        if (config.trigger === 'focus') {
            const handleFocusIn = () => {
                activateMemoInternal(memo, element, config);
            };

            const handleFocusOut = () => {
                if (config.hideCondition === 'trigger-end') {
                    deactivateMemoInternal(memo.id);
                }
            };

            element.addEventListener('focusin', handleFocusIn);
            element.addEventListener('focusout', handleFocusOut);

            cleanupFunctionsRef.current.push(() => {
                element.removeEventListener('focusin', handleFocusIn);
                element.removeEventListener('focusout', handleFocusOut);
                delete (element as any).__pageminder_registered;
            });
        }
    }, []);

    // パフォーマンス最適化: セレクタでグルーピングしたマップを構築
    const buildSelectorMemoMap = useCallback((activatableMemos: Memo[]): Map<string, Memo[]> => {
        const map = new Map<string, Memo[]>();
        for (const memo of activatableMemos) {
            const selector = memo.activation!.selector;
            if (!map.has(selector)) map.set(selector, []);
            map.get(selector)!.push(memo);
        }
        return map;
    }, []);

    // 全てのアクティブ化可能なメモに対してセレクタをスキャンしてリスナーを設定
    const scanAndSetupListeners = useCallback((activatableMemos: Memo[]) => {
        let newElementsFound = 0;

        // セレクタでグルーピングして同一セレクタは1回だけクエリ
        const selectorMemoMap = buildSelectorMemoMap(activatableMemos);
        selectorMemoMapRef.current = selectorMemoMap;

        for (const [selector, memos] of selectorMemoMap) {
            try {
                const elements = document.querySelectorAll(selector);

                elements.forEach(element => {
                    for (const memo of memos) {
                        const config = memo.activation!;
                        const elementKey = `${memo.id}:${selector}`;
                        if ((element as any).__pageminder_registered !== elementKey) {
                            newElementsFound++;
                            setupListenersForElement(memo, element, config);
                        }
                    }
                });
            } catch (error) {
                logger.warn('Invalid selector', { selector, error: String(error) });
            }
        }

        if (newElementsFound > 0) {
            logger.info('Activation: New elements found and registered', { count: newElementsFound });
        }
    }, [setupListenersForElement, buildSelectorMemoMap]);

    // パフォーマンス最適化: 追加されたノードのみをチェック
    const checkNodesForSelectors = useCallback((nodes: Element[]) => {
        const selectorMemoMap = selectorMemoMapRef.current;
        if (!selectorMemoMap || selectorMemoMap.size === 0) return;

        let newElementsFound = 0;

        for (const [selector, memos] of selectorMemoMap) {
            for (const node of nodes) {
                // ノード自体がセレクタにマッチするか
                try {
                    if (node.matches?.(selector)) {
                        for (const memo of memos) {
                            const config = memo.activation!;
                            const elementKey = `${memo.id}:${selector}`;
                            if ((node as any).__pageminder_registered !== elementKey) {
                                newElementsFound++;
                                setupListenersForElement(memo, node, config);
                            }
                        }
                    }
                } catch {
                    // 無効なセレクタは無視
                }

                // ノードの子孫でセレクタにマッチするものを検索
                try {
                    const descendants = node.querySelectorAll?.(selector);
                    descendants?.forEach(el => {
                        for (const memo of memos) {
                            const config = memo.activation!;
                            const elementKey = `${memo.id}:${selector}`;
                            if ((el as any).__pageminder_registered !== elementKey) {
                                newElementsFound++;
                                setupListenersForElement(memo, el, config);
                            }
                        }
                    });
                } catch {
                    // 無効なセレクタは無視
                }
            }
        }

        if (newElementsFound > 0) {
            logger.debug('Activation: New elements found in added nodes', { count: newElementsFound });
        }
    }, [setupListenersForElement]);

    // メモの変更を監視してイベントリスナーを設定
    useEffect(() => {
        // 1. 以前のリスナーをクリーンアップ
        cleanupFunctionsRef.current.forEach(cleanup => cleanup());
        cleanupFunctionsRef.current = [];

        // 2. MutationObserverをクリーンアップ
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
        if (rescanTimeoutRef.current) {
            clearTimeout(rescanTimeoutRef.current);
            rescanTimeoutRef.current = null;
        }

        // 3. アクティブ化が有効なメモをフィルタ
        const activatableMemos = memos.filter(
            memo => memo.activation?.enabled && memo.activation?.selector
        );

        if (activatableMemos.length === 0) {
            logger.debug('No activatable memos found');
            return;
        }

        logger.info('Activation: Setting up listeners', {
            memoCount: activatableMemos.length,
            selectors: activatableMemos.map(m => m.activation?.selector)
        });

        // 4. 初回スキャン
        scanAndSetupListeners(activatableMemos);

        // 4.5. 初回ロード時の遅延リトライ（DOMがまだ構築中の場合に対応）
        // SPAやSlowなページでは、要素が後から追加される可能性があるため
        const retryTimeouts: ReturnType<typeof setTimeout>[] = [];
        [500, 1500, 3000].forEach(delay => {
            const timeoutId = setTimeout(() => {
                logger.debug('Activation: Delayed rescan', { delay });
                scanAndSetupListeners(activatableMemos);
            }, delay);
            retryTimeouts.push(timeoutId);
        });

        // 5. MutationObserverで動的DOM変更を監視（ターゲット型スキャン）
        // 追加されたノードをバッファリングしてデバウンス
        let pendingNodes: Element[] = [];

        const debouncedCheckNodes = () => {
            if (rescanTimeoutRef.current) {
                clearTimeout(rescanTimeoutRef.current);
            }
            // 100msのデバウンスで追加ノードをチェック
            rescanTimeoutRef.current = setTimeout(() => {
                if (pendingNodes.length > 0) {
                    checkNodesForSelectors(pendingNodes);
                    pendingNodes = [];
                }
            }, 100);
        };

        observerRef.current = new MutationObserver((mutations) => {
            // 追加されたノードを収集（ターゲット型スキャン）
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        pendingNodes.push(node as Element);
                    }
                });
            }

            if (pendingNodes.length > 0) {
                debouncedCheckNodes();
            }
        });

        // body全体を監視（childList + subtree）
        observerRef.current.observe(document.body, {
            childList: true,
            subtree: true
        });

        logger.debug('MutationObserver started for activation');

        return () => {
            cleanupFunctionsRef.current.forEach(cleanup => cleanup());
            cleanupFunctionsRef.current = [];
            timeoutIdsRef.current.forEach(id => clearTimeout(id));
            timeoutIdsRef.current.clear();

            // 遅延リトライのタイムアウトをクリア
            retryTimeouts.forEach(id => clearTimeout(id));

            // バッファをクリア
            pendingNodes = [];

            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
            if (rescanTimeoutRef.current) {
                clearTimeout(rescanTimeoutRef.current);
                rescanTimeoutRef.current = null;
            }

            // セレクタマップをクリア
            selectorMemoMapRef.current = null;
        };
    }, [memos, scanAndSetupListeners, checkNodesForSelectors]);

    return {
        deactivateMemo: deactivateMemoInternal,
        isActive: (memoId: string) => activeStatesRef.current.has(memoId),
        pauseDeactivation,
        resumeDeactivation,
    };
}
