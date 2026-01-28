// =============================================================================
// PageMinder - Activation Overlay Component (with Ruler)
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Memo, ActivationConfig } from '@/types';
import { Memo as MemoComponent } from './Memo';
import type { GlobalSettings } from '@/types';

interface ActivationOverlayProps {
    memo: Memo;
    triggerElement: Element;
    settings: GlobalSettings;
    onUpdate: (memo: Memo) => void;
    onDelete: (memoId: string) => void; // データの削除
    onClose: () => void; // 非表示（アクティブ化解除）
    onStartElementPicker: (memoId: string) => void;
    onPauseActivation: (reason: string) => void;
    onResumeActivation: (reason: string) => void;
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

/**
 * アクティブ化されたメモを表示するオーバーレイ
 * トリガー要素の近くまたは固定位置に表示
 */
export function ActivationOverlay({
    memo,
    triggerElement,
    settings,
    onUpdate,
    onDelete,
    onClose,
    onStartElementPicker,
    onPauseActivation,
    onResumeActivation,
}: ActivationOverlayProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [ruler, setRuler] = useState<RulerInfo>({ visible: false });
    const overlayRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 });
    const config = memo.activation;

    // トリガー要素の位置を取得
    const getElementRect = useCallback(() => {
        return triggerElement.getBoundingClientRect();
    }, [triggerElement]);

    // 表示位置を計算
    const calculatePosition = useCallback(() => {
        if (!config) return { x: 0, y: 0 };

        if (config.positionMode === 'near-element') {
            const rect = getElementRect();
            const offsetX = config.offsetX ?? 10;
            const offsetY = config.offsetY ?? 10;
            
            // 要素の右下に配置（スクロール位置を加算）
            let x = rect.right + offsetX + window.scrollX;
            let y = rect.bottom + offsetY + window.scrollY;

            // 画面外にはみ出る場合は調整
            const overlayWidth = overlayRef.current?.offsetWidth ?? 300;
            const overlayHeight = overlayRef.current?.offsetHeight ?? 200;
            
            if (x + overlayWidth > window.innerWidth + window.scrollX) {
                x = rect.left - overlayWidth - offsetX + window.scrollX;
            }
            if (y + overlayHeight > window.innerHeight + window.scrollY) {
                y = rect.top - overlayHeight - offsetY + window.scrollY;
            }

            return { x: Math.max(0, x), y: Math.max(0, y) };
        } else {
            // fixed-position: メモ本来の位置を使用
            const patternId = memo.urlPatterns[0]?.id ?? 'default';
            const memoPosition = memo.positions[patternId];
            if (memoPosition) {
                return { x: memoPosition.x, y: memoPosition.y };
            }
            return { x: 100, y: 100 };
        }
    }, [config, getElementRect, memo]);

    // ルーラー情報を計算
    const calculateRuler = useCallback((memoX: number, memoY: number): RulerInfo => {
        if (!config || config.positionMode !== 'near-element') {
            return { visible: false };
        }

        const rect = getElementRect();
        const overlayWidth = overlayRef.current?.offsetWidth ?? 300;
        const overlayHeight = overlayRef.current?.offsetHeight ?? 200;

        // メモの中心座標（スクロール補正前のビューポート座標）
        const memoViewX = memoX - window.scrollX;
        const memoViewY = memoY - window.scrollY;
        const memoCenterX = memoViewX + overlayWidth / 2;
        const memoCenterY = memoViewY + overlayHeight / 2;

        // 要素の中心座標
        const elemCenterX = rect.left + rect.width / 2;
        const elemCenterY = rect.top + rect.height / 2;

        // メモが要素の右にあるか左にあるか
        const isRight = memoViewX >= rect.right;
        const isLeft = memoViewX + overlayWidth <= rect.left;
        const isBelow = memoViewY >= rect.bottom;
        const isAbove = memoViewY + overlayHeight <= rect.top;

        let horizontalLine: RulerInfo['horizontalLine'];
        let verticalLine: RulerInfo['verticalLine'];

        // 水平方向のルーラー
        if (isRight) {
            const distance = memoViewX - rect.right;
            horizontalLine = {
                x1: rect.right,
                y1: memoCenterY,
                x2: memoViewX,
                y2: memoCenterY,
                distance: Math.round(distance),
            };
        } else if (isLeft) {
            const distance = rect.left - (memoViewX + overlayWidth);
            horizontalLine = {
                x1: memoViewX + overlayWidth,
                y1: memoCenterY,
                x2: rect.left,
                y2: memoCenterY,
                distance: Math.round(distance),
            };
        }

        // 垂直方向のルーラー
        if (isBelow) {
            const distance = memoViewY - rect.bottom;
            verticalLine = {
                x1: memoCenterX,
                y1: rect.bottom,
                x2: memoCenterX,
                y2: memoViewY,
                distance: Math.round(distance),
            };
        } else if (isAbove) {
            const distance = rect.top - (memoViewY + overlayHeight);
            verticalLine = {
                x1: memoCenterX,
                y1: memoViewY + overlayHeight,
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

    // 初期位置を設定
    useEffect(() => {
        const pos = calculatePosition();
        setPosition(pos);
    }, [calculatePosition]);

    // スクロールやリサイズ時に再計算（ドラッグ中以外）
    useEffect(() => {
        if (isDragging) return;

        const handleUpdate = () => {
            const pos = calculatePosition();
            setPosition(pos);
        };

        window.addEventListener('scroll', handleUpdate);
        window.addEventListener('resize', handleUpdate);

        return () => {
            window.removeEventListener('scroll', handleUpdate);
            window.removeEventListener('resize', handleUpdate);
        };
    }, [isDragging, calculatePosition]);

    // ドラッグ開始
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (config?.positionMode !== 'near-element') return;
        
        e.preventDefault();
        setIsDragging(true);
        onPauseActivation('drag');
        
        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            offsetX: config.offsetX ?? 10,
            offsetY: config.offsetY ?? 10,
        };

        // 初期ルーラー表示
        setRuler(calculateRuler(position.x, position.y));
    }, [config, onPauseActivation, position, calculateRuler]);

    // ドラッグ中
    useEffect(() => {
        if (!isDragging || !config) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStartRef.current.mouseX;
            const deltaY = e.clientY - dragStartRef.current.mouseY;

            const newOffsetX = dragStartRef.current.offsetX + deltaX;
            const newOffsetY = dragStartRef.current.offsetY + deltaY;

            // 新しい位置を計算
            const rect = getElementRect();
            let newX = rect.right + newOffsetX + window.scrollX;
            let newY = rect.bottom + newOffsetY + window.scrollY;

            // 画面外調整
            const overlayWidth = overlayRef.current?.offsetWidth ?? 300;
            const overlayHeight = overlayRef.current?.offsetHeight ?? 200;

            if (newX + overlayWidth > window.innerWidth + window.scrollX) {
                newX = rect.left - overlayWidth - Math.abs(newOffsetX) + window.scrollX;
            }
            if (newY + overlayHeight > window.innerHeight + window.scrollY) {
                newY = rect.top - overlayHeight - Math.abs(newOffsetY) + window.scrollY;
            }

            newX = Math.max(0, newX);
            newY = Math.max(0, newY);

            setPosition({ x: newX, y: newY });
            setRuler(calculateRuler(newX, newY));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setRuler({ visible: false });
            onResumeActivation('drag');

            // オフセットを保存
            const rect = getElementRect();
            const currentOffsetX = position.x - window.scrollX - rect.right;
            const currentOffsetY = position.y - window.scrollY - rect.bottom;

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
        };
    }, [isDragging, config, getElementRect, position, memo, onUpdate, onResumeActivation, calculateRuler]);

    // 要素ハイライト
    useEffect(() => {
        if (!config?.highlightElement) return;

        const highlightColor = config.highlightColor ?? 'rgba(255, 193, 7, 0.3)';
        const originalOutline = (triggerElement as HTMLElement).style.outline;
        const originalBoxShadow = (triggerElement as HTMLElement).style.boxShadow;

        (triggerElement as HTMLElement).style.outline = `3px solid ${highlightColor}`;
        (triggerElement as HTMLElement).style.boxShadow = `0 0 10px ${highlightColor}`;

        return () => {
            (triggerElement as HTMLElement).style.outline = originalOutline;
            (triggerElement as HTMLElement).style.boxShadow = originalBoxShadow;
        };
    }, [config, triggerElement]);

    if (!config) return null;

    const isNearElement = config.positionMode === 'near-element';

    return (
        <>
            {/* ルーラー表示 */}
            {ruler.visible && (
                <svg
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        pointerEvents: 'none',
                        zIndex: 2147483646,
                    }}
                >
                    {/* 水平ルーラー */}
                    {ruler.horizontalLine && (
                        <>
                            <line
                                x1={ruler.horizontalLine.x1}
                                y1={ruler.horizontalLine.y1}
                                x2={ruler.horizontalLine.x2}
                                y2={ruler.horizontalLine.y2}
                                stroke="#FF5722"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                            <text
                                x={(ruler.horizontalLine.x1 + ruler.horizontalLine.x2) / 2}
                                y={ruler.horizontalLine.y1 - 8}
                                fill="#FF5722"
                                fontSize="12"
                                fontWeight="bold"
                                textAnchor="middle"
                                style={{ textShadow: '0 0 3px white, 0 0 3px white' }}
                            >
                                {ruler.horizontalLine.distance}px
                            </text>
                        </>
                    )}
                    {/* 垂直ルーラー */}
                    {ruler.verticalLine && (
                        <>
                            <line
                                x1={ruler.verticalLine.x1}
                                y1={ruler.verticalLine.y1}
                                x2={ruler.verticalLine.x2}
                                y2={ruler.verticalLine.y2}
                                stroke="#2196F3"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                            <text
                                x={ruler.verticalLine.x1 + 8}
                                y={(ruler.verticalLine.y1 + ruler.verticalLine.y2) / 2}
                                fill="#2196F3"
                                fontSize="12"
                                fontWeight="bold"
                                style={{ textShadow: '0 0 3px white, 0 0 3px white' }}
                            >
                                {ruler.verticalLine.distance}px
                            </text>
                        </>
                    )}
                </svg>
            )}

            {/* メモオーバーレイ */}
            <div
                ref={overlayRef}
                data-memo-id={memo.id}
                className="pageminder-activation-overlay"
                style={{
                    position: isNearElement ? 'absolute' : 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    zIndex: 2147483645,
                    cursor: isNearElement ? (isDragging ? 'grabbing' : 'grab') : 'default',
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
