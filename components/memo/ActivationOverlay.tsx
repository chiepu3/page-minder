// =============================================================================
// PageMinder - Activation Overlay Component (with Ruler)
// =============================================================================

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import type { Memo, ActivationConfig } from '@/types';
import { Memo as MemoComponent } from './Memo';
import type { GlobalSettings } from '@/types';

interface ActivationOverlayProps {
    memo: Memo;
    triggerElement: Element;
    settings: GlobalSettings;
    onUpdate: (memo: Memo) => void;
    onDelete: (memoId: string) => void;
    onClose: () => void;
    onStartElementPicker: (memoId: string) => void;
    onPauseActivation: (reason: string) => void;
    onResumeActivation: (reason: string) => void;
    isHiddenByVisibility?: boolean;
}

interface RulerInfo {
    visible: boolean;
    // 水平ルーラー
    horizontalLine?: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        distance: number;
    };
    // 垂直ルーラー
    verticalLine?: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        distance: number;
    };
}

// ドラッグ中のキャッシュ用型
interface DragCache {
    elementRect: DOMRect;
    overlayWidth: number;
    overlayHeight: number;
}

/**
 * アクティブ化されたメモを表示するオーバーレイ
 * トリガー要素の近くまたは固定位置に表示
 */
function ActivationOverlayComponent({
    memo,
    triggerElement,
    settings,
    onUpdate,
    onDelete,
    onClose,
    onStartElementPicker,
    onPauseActivation,
    onResumeActivation,
    isHiddenByVisibility = false,
}: ActivationOverlayProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [ruler, setRuler] = useState<RulerInfo>({ visible: false });
    const [isTriggerVisible, setIsTriggerVisible] = useState(true);
    const overlayRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 });
    const config = memo.activation;

    // パフォーマンス最適化: オーバーレイサイズをキャッシュ
    const overlaySize = useRef({ width: 300, height: 200 });

    // パフォーマンス最適化: ドラッグ中のキャッシュ
    const dragCache = useRef<DragCache | null>(null);

    // パフォーマンス最適化: ルーラーSVG要素への直接参照
    const rulerSvgRef = useRef<SVGSVGElement>(null);
    const horizontalLineRef = useRef<SVGLineElement>(null);
    const horizontalTextRef = useRef<SVGTextElement>(null);
    const verticalLineRef = useRef<SVGLineElement>(null);
    const verticalTextRef = useRef<SVGTextElement>(null);

    // パフォーマンス最適化: rAF IDの追跡
    const rafIdRef = useRef<number | null>(null);

    // ResizeObserverでオーバーレイサイズを監視
    useEffect(() => {
        if (!overlayRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                overlaySize.current = {
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                };
            }
        });
        resizeObserver.observe(overlayRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // トリガー要素の位置を取得
    const getElementRect = useCallback(() => {
        return triggerElement.getBoundingClientRect();
    }, [triggerElement]);

    // 表示位置を計算（キャッシュされたサイズを使用）
    // position: fixed + viewport座標で統一（transform/zoomの影響を回避）
    const calculatePosition = useCallback(() => {
        if (!config) return { x: 0, y: 0 };

        if (config.positionMode === 'near-element') {
            const rect = getElementRect();
            const offsetX = config.offsetX ?? 10;
            const offsetY = config.offsetY ?? 10;

            let x = rect.right + offsetX;
            let y = rect.bottom + offsetY;

            const { width: overlayWidth, height: overlayHeight } = overlaySize.current;

            if (x + overlayWidth > window.innerWidth) {
                x = rect.left - overlayWidth - offsetX;
            }
            if (y + overlayHeight > window.innerHeight) {
                y = rect.top - overlayHeight - offsetY;
            }

            return { x: Math.max(0, x), y: Math.max(0, y) };
        } else {
            const patternId = memo.urlPatterns[0]?.id ?? 'default';
            const memoPosition = memo.positions[patternId];
            if (memoPosition) {
                return { x: memoPosition.x, y: memoPosition.y };
            }
            return { x: 100, y: 100 };
        }
    }, [config, getElementRect, memo]);

    // ルーラー情報を計算（キャッシュ使用版、オプション引数でDOM計測回避）
    const calculateRuler = useCallback((
        memoX: number,
        memoY: number,
        cachedRect?: DOMRect,
        cachedOverlayWidth?: number,
        cachedOverlayHeight?: number
    ): RulerInfo => {
        if (!config || config.positionMode !== 'near-element') {
            return { visible: false };
        }

        const rect = cachedRect ?? getElementRect();
        const overlayWidth = cachedOverlayWidth ?? overlaySize.current.width;
        const overlayHeight = cachedOverlayHeight ?? overlaySize.current.height;

        // メモの中心座標（viewport座標）
        const memoCenterX = memoX + overlayWidth / 2;
        const memoCenterY = memoY + overlayHeight / 2;

        // メモが要素の右にあるか左にあるか
        const isRight = memoX >= rect.right;
        const isLeft = memoX + overlayWidth <= rect.left;
        const isBelow = memoY >= rect.bottom;
        const isAbove = memoY + overlayHeight <= rect.top;

        let horizontalLine: RulerInfo['horizontalLine'];
        let verticalLine: RulerInfo['verticalLine'];

        // 水平方向のルーラー
        if (isRight) {
            const distance = memoX - rect.right;
            horizontalLine = {
                x1: rect.right,
                y1: memoCenterY,
                x2: memoX,
                y2: memoCenterY,
                distance: Math.round(distance),
            };
        } else if (isLeft) {
            const distance = rect.left - (memoX + overlayWidth);
            horizontalLine = {
                x1: memoX + overlayWidth,
                y1: memoCenterY,
                x2: rect.left,
                y2: memoCenterY,
                distance: Math.round(distance),
            };
        }

        // 垂直方向のルーラー
        if (isBelow) {
            const distance = memoY - rect.bottom;
            verticalLine = {
                x1: memoCenterX,
                y1: rect.bottom,
                x2: memoCenterX,
                y2: memoY,
                distance: Math.round(distance),
            };
        } else if (isAbove) {
            const distance = rect.top - (memoY + overlayHeight);
            verticalLine = {
                x1: memoCenterX,
                y1: memoY + overlayHeight,
                x2: memoCenterX,
                y2: rect.top,
                distance: Math.round(distance),
            };
        }

        return {
            visible: true,
            horizontalLine,
            verticalLine,
        };
    }, [config, getElementRect]);

    // パフォーマンス最適化: ルーラーSVGを直接更新（React再レンダリング回避）
    const updateRulerDirectly = useCallback((rulerInfo: RulerInfo) => {
        if (!rulerInfo.visible) return;

        // 水平ルーラーの更新
        if (horizontalLineRef.current && horizontalTextRef.current) {
            if (rulerInfo.horizontalLine) {
                const h = rulerInfo.horizontalLine;
                horizontalLineRef.current.setAttribute('x1', String(h.x1));
                horizontalLineRef.current.setAttribute('y1', String(h.y1));
                horizontalLineRef.current.setAttribute('x2', String(h.x2));
                horizontalLineRef.current.setAttribute('y2', String(h.y2));
                horizontalLineRef.current.style.display = '';
                horizontalTextRef.current.setAttribute('x', String((h.x1 + h.x2) / 2));
                horizontalTextRef.current.setAttribute('y', String(h.y1 - 8));
                horizontalTextRef.current.textContent = `${h.distance}px`;
                horizontalTextRef.current.style.display = '';
            } else {
                horizontalLineRef.current.style.display = 'none';
                horizontalTextRef.current.style.display = 'none';
            }
        }

        // 垂直ルーラーの更新
        if (verticalLineRef.current && verticalTextRef.current) {
            if (rulerInfo.verticalLine) {
                const v = rulerInfo.verticalLine;
                verticalLineRef.current.setAttribute('x1', String(v.x1));
                verticalLineRef.current.setAttribute('y1', String(v.y1));
                verticalLineRef.current.setAttribute('x2', String(v.x2));
                verticalLineRef.current.setAttribute('y2', String(v.y2));
                verticalLineRef.current.style.display = '';
                verticalTextRef.current.setAttribute('x', String(v.x1 + 8));
                verticalTextRef.current.setAttribute('y', String((v.y1 + v.y2) / 2));
                verticalTextRef.current.textContent = `${v.distance}px`;
                verticalTextRef.current.style.display = '';
            } else {
                verticalLineRef.current.style.display = 'none';
                verticalTextRef.current.style.display = 'none';
            }
        }
    }, []);

    // 初期位置を設定
    useEffect(() => {
        const pos = calculatePosition();
        setPosition(pos);
    }, [calculatePosition]);

    // スクロールやリサイズ時に再計算（ドラッグ中以外）- rAFでスロットリング
    useEffect(() => {
        if (isDragging) return;

        let rafId: number | null = null;
        let pending = false;

        const handleUpdate = () => {
            if (pending) return;
            pending = true;
            rafId = requestAnimationFrame(() => {
                if (config?.positionMode === 'near-element') {
                    const rect = triggerElement.getBoundingClientRect();
                    const isVisible = !(rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth);
                    setIsTriggerVisible(isVisible);
                }
                const pos = calculatePosition();
                setPosition(pos);
                pending = false;
            });
        };

        window.addEventListener('scroll', handleUpdate, { passive: true });
        window.addEventListener('resize', handleUpdate);

        return () => {
            window.removeEventListener('scroll', handleUpdate);
            window.removeEventListener('resize', handleUpdate);
            if (rafId !== null) cancelAnimationFrame(rafId);
        };
    }, [isDragging, calculatePosition, config, triggerElement]);

    // ドラッグ開始
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (config?.positionMode !== 'near-element') return;

        e.preventDefault();
        setIsDragging(true);
        onPauseActivation('drag');

        // パフォーマンス最適化: ドラッグ開始時に要素位置をキャッシュ
        dragCache.current = {
            elementRect: triggerElement.getBoundingClientRect(),
            overlayWidth: overlaySize.current.width,
            overlayHeight: overlaySize.current.height,
        };

        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            offsetX: config.offsetX ?? 10,
            offsetY: config.offsetY ?? 10,
        };

        // 初期ルーラー表示
        setRuler(calculateRuler(position.x, position.y));
    }, [config, onPauseActivation, position, calculateRuler, triggerElement]);

    // ドラッグ中 - キャッシュ使用 + rAF + 直接DOM更新で最適化
    useEffect(() => {
        if (!isDragging || !config) return;

        // 現在の位置を追跡（mouseupで使用）
        let currentX = position.x;
        let currentY = position.y;

        const handleMouseMove = (e: MouseEvent) => {
            // 既存のrAFをキャンセル
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }

            rafIdRef.current = requestAnimationFrame(() => {
                const cache = dragCache.current;
                if (!cache) return;

                const deltaX = e.clientX - dragStartRef.current.mouseX;
                const deltaY = e.clientY - dragStartRef.current.mouseY;

                const newOffsetX = dragStartRef.current.offsetX + deltaX;
                const newOffsetY = dragStartRef.current.offsetY + deltaY;

                const rect = triggerElement.getBoundingClientRect();

                let newX = rect.right + newOffsetX;
                let newY = rect.bottom + newOffsetY;

                const { overlayWidth, overlayHeight } = cache;

                if (newX + overlayWidth > window.innerWidth) {
                    newX = rect.left - overlayWidth - Math.abs(newOffsetX);
                }
                if (newY + overlayHeight > window.innerHeight) {
                    newY = rect.top - overlayHeight - Math.abs(newOffsetY);
                }

                newX = Math.max(0, newX);
                newY = Math.max(0, newY);

                currentX = newX;
                currentY = newY;

                setPosition({ x: newX, y: newY });

                // ルーラーを直接更新（React再レンダリング回避）
                const rulerInfo = calculateRuler(
                    newX,
                    newY,
                    cache.elementRect,
                    cache.overlayWidth,
                    cache.overlayHeight
                );
                updateRulerDirectly(rulerInfo);
            });
        };

        const handleMouseUp = () => {
            // rAFをキャンセル
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }

            setIsDragging(false);
            setRuler({ visible: false });
            onResumeActivation('drag');

            // キャッシュをクリア
            dragCache.current = null;

            // オフセットを保存（最新の要素位置を取得）
            const rect = triggerElement.getBoundingClientRect();
            const currentOffsetX = currentX - rect.right;
            const currentOffsetY = currentY - rect.bottom;

            if (memo.activation) {
                const updatedMemo: Memo = {
                    ...memo,
                    activation: {
                        ...memo.activation,
                        offsetX: Math.round(currentOffsetX),
                        offsetY: Math.round(currentOffsetY),
                    },
                };
                onUpdate(updatedMemo);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, [isDragging, config, position, memo, onUpdate, onResumeActivation, calculateRuler, updateRulerDirectly, triggerElement]);

    // 要素ハイライト - CSSカスタムプロパティとクラスを使用（レイアウト再計算回避）
    useEffect(() => {
        if (!config?.highlightElement) return;

        const element = triggerElement as HTMLElement;
        const highlightColor = config.highlightColor ?? 'rgba(255, 193, 7, 0.3)';

        element.style.setProperty('--pageminder-highlight-color', highlightColor);
        element.classList.add('pageminder-highlight');

        return () => {
            element.classList.remove('pageminder-highlight');
            element.style.removeProperty('--pageminder-highlight-color');
        };
    }, [config, triggerElement]);

    if (!config) return null;

    const isNearElement = config.positionMode === 'near-element';

    return (
        <>
            {/* ルーラー表示 - 常にレンダリングしておき、表示/非表示はstyleで制御 */}
            <svg
                ref={rulerSvgRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    pointerEvents: 'none',
                    zIndex: 2147483646,
                    display: ruler.visible ? 'block' : 'none',
                }}
            >
                {/* 水平ルーラー */}
                <line
                    ref={horizontalLineRef}
                    x1={ruler.horizontalLine?.x1 ?? 0}
                    y1={ruler.horizontalLine?.y1 ?? 0}
                    x2={ruler.horizontalLine?.x2 ?? 0}
                    y2={ruler.horizontalLine?.y2 ?? 0}
                    stroke="#FF5722"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    style={{ display: ruler.horizontalLine ? '' : 'none' }}
                />
                <text
                    ref={horizontalTextRef}
                    x={ruler.horizontalLine ? (ruler.horizontalLine.x1 + ruler.horizontalLine.x2) / 2 : 0}
                    y={ruler.horizontalLine ? ruler.horizontalLine.y1 - 8 : 0}
                    fill="#FF5722"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    style={{
                        textShadow: '0 0 3px white, 0 0 3px white',
                        display: ruler.horizontalLine ? '' : 'none',
                    }}
                >
                    {ruler.horizontalLine?.distance ?? 0}px
                </text>
                {/* 垂直ルーラー */}
                <line
                    ref={verticalLineRef}
                    x1={ruler.verticalLine?.x1 ?? 0}
                    y1={ruler.verticalLine?.y1 ?? 0}
                    x2={ruler.verticalLine?.x2 ?? 0}
                    y2={ruler.verticalLine?.y2 ?? 0}
                    stroke="#2196F3"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    style={{ display: ruler.verticalLine ? '' : 'none' }}
                />
                <text
                    ref={verticalTextRef}
                    x={ruler.verticalLine ? ruler.verticalLine.x1 + 8 : 0}
                    y={ruler.verticalLine ? (ruler.verticalLine.y1 + ruler.verticalLine.y2) / 2 : 0}
                    fill="#2196F3"
                    fontSize="12"
                    fontWeight="bold"
                    style={{
                        textShadow: '0 0 3px white, 0 0 3px white',
                        display: ruler.verticalLine ? '' : 'none',
                    }}
                >
                    {ruler.verticalLine?.distance ?? 0}px
                </text>
            </svg>

            {/* メモオーバーレイ
                注意: transformを使うとcontaining blockが作成され、
                子孫のposition:fixedが正常に機能しなくなる（モーダルが壊れる）
                そのため、left/topを直接指定する */}
            <div
                ref={overlayRef}
                data-memo-id={memo.id}
                className="pageminder-activation-overlay"
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    zIndex: 2147483645,
                    cursor: isNearElement ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    display: (!isTriggerVisible || isHiddenByVisibility) ? 'none' : '',
                }}
                onMouseDown={isNearElement ? handleMouseDown : undefined}
                onMouseEnter={() => onPauseActivation('hover-on-memo')}
                onMouseLeave={() => {
                    if (!isDragging) {
                        onResumeActivation('hover-on-memo');
                    }
                }}
            >
                <MemoComponent
                    memo={memo}
                    settings={settings}
                    onUpdate={onUpdate}
                    onDelete={() => {
                        onDelete(memo.id);
                        onClose();
                    }}
                    onStartElementPicker={() => onStartElementPicker(memo.id)}
                    isActivated={true}
                    onPauseActivation={onPauseActivation}
                    onResumeActivation={onResumeActivation}
                />
            </div>
        </>
    );
}

// React.memoでラップして不要な再レンダリングを防止
// 注意: 表示に影響するすべてのフィールドを比較する必要がある
export const ActivationOverlay = memo(ActivationOverlayComponent, (prevProps, nextProps) => {
    // メモの重要なフィールドが変更されたかチェック
    const prevMemo = prevProps.memo;
    const nextMemo = nextProps.memo;

    return (
        prevMemo.id === nextMemo.id &&
        prevMemo.content === nextMemo.content &&
        prevMemo.title === nextMemo.title &&
        prevMemo.backgroundColor === nextMemo.backgroundColor &&
        prevMemo.textColor === nextMemo.textColor &&
        prevMemo.fontSize === nextMemo.fontSize &&
        prevMemo.minimized === nextMemo.minimized &&
        // URLパターンはJSON比較（配列のため）
        JSON.stringify(prevMemo.urlPatterns) === JSON.stringify(nextMemo.urlPatterns) &&
        // アクティベーション設定も全体を比較
        JSON.stringify(prevMemo.activation) === JSON.stringify(nextMemo.activation) &&
        prevProps.triggerElement === nextProps.triggerElement &&
        prevProps.settings === nextProps.settings
    );
});
