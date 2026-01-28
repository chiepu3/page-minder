// =============================================================================
// PageMinder - Activation Overlay Component
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import type { Memo } from '@/types';
import { Memo as MemoComponent } from './Memo';
import { Ruler } from './Ruler';
import type { GlobalSettings } from '@/types';
import { useDraggable } from '@/hooks/useDraggable';

interface ActivationOverlayProps {
    memo: Memo;
    triggerElement: Element;
    settings: GlobalSettings;
    onUpdate: (memo: Memo) => void;
    onClose: () => void;
    onPauseActivation: (reason: string) => void;
    onResumeActivation: (reason: string) => void;
}

/**
 * アクティブ化されたメモを表示するオーバーレイ
 * トリガー要素の近くまたは固定位置に表示
 * ドラッグ操作とルーラー表示を管理
 */
export function ActivationOverlay({
    memo,
    triggerElement,
    settings,
    onUpdate,
    onClose,
    onPauseActivation,
    onResumeActivation,
}: ActivationOverlayProps) {
    const config = memo.activation;
    const overlayRef = useRef<HTMLDivElement>(null);
    
    // スクロール位置の監視
    const [scroll, setScroll] = useState({ x: window.scrollX, y: window.scrollY });
    
    // 初期位置計算
    const calculateInitialPosition = () => {
        if (!config) return { x: 0, y: 0 };

        if (config.positionMode === 'near-element') {
            const rect = triggerElement.getBoundingClientRect();
            const offsetX = config.offsetX ?? 10;
            const offsetY = config.offsetY ?? 10;
            
            // 要素基準の位置（絶対座標）
            let x = rect.right + offsetX + window.scrollX;
            let y = rect.bottom + offsetY + window.scrollY;

            // 画面外チェック（簡易的）
            const overlayWidth = 300;
            const overlayHeight = 200;
            
            if (x + overlayWidth > window.innerWidth + window.scrollX) {
                x = rect.left - overlayWidth - offsetX + window.scrollX;
            }
            if (y + overlayHeight > window.innerHeight + window.scrollY) {
                y = rect.top - overlayHeight - offsetY + window.scrollY;
            }

            return { x, y };
        } else {
            // 固定モード: メモの保存された位置を使用
            const patternId = memo.urlPatterns[0]?.id ?? 'default';
            const memoPosition = memo.positions[patternId];
            if (memoPosition) {
                return { x: memoPosition.x, y: memoPosition.y };
            }
            return { x: 100, y: 100 };
        }
    };

    const [currentPosition, setCurrentPosition] = useState(calculateInitialPosition());

    // ドラッグ機能 (ActivaitonOverlayで管理)
    const { position: dragPosition, handleMouseDown, isDragging } = useDraggable({
        initialPosition: currentPosition,
        onPositionChange: (newPos) => {
            setCurrentPosition(newPos);
        },
        onDragEnd: (finalPos) => {
            if (!config) return;

            if (config.positionMode === 'near-element') {
                // オフセットを計算して保存
                const rect = triggerElement.getBoundingClientRect();
                // メモの中心座標（絶対座標）
                // ※ ここでは簡易的に左上座標の差分を計算
                // より高度にするなら中心点間の距離にするが、まずは左上基準の相対座標とする
                // ただし、初期計算ロジック（rect.right/bottom）との整合性を考慮する必要がある
                // シンプルに: メモの左上 - 要素の右下 をオフセットとする（初期配置ロジックに合わせる）
                
                // ただしRulerは中心距離を表示しているので、ユーザーには「距離」として認識される
                // ここでは「現在の位置を再現できるオフセット」を保存するのが目的
                
                // 初期配置: x = rect.right + offsetX + scrollX
                // => offsetX = x - scrollX - rect.right
                
                // Yも同様
                // => offsetY = y - scrollY - rect.bottom
                
                const newOffsetX = finalPos.x - window.scrollX - rect.right;
                const newOffsetY = finalPos.y - window.scrollY - rect.bottom;
                
                onUpdate({
                    ...memo,
                    activation: {
                        ...config,
                        offsetX: newOffsetX,
                        offsetY: newOffsetY,
                    }
                });
            } else {
                // 固定モード: 座標をそのまま保存
                const patternId = memo.urlPatterns[0]?.id ?? 'default';
                const currentPos = memo.positions[patternId] || {};
                
                onUpdate({
                    ...memo,
                    positions: {
                        ...memo.positions,
                        [patternId]: {
                            ...currentPos,
                            x: finalPos.x,
                            y: finalPos.y,
                        }
                    }
                });
            }
        }
    });

    // スクロール追従と初期位置再計算
    useEffect(() => {
        const handleScroll = () => {
            setScroll({ x: window.scrollX, y: window.scrollY });
        };
        window.addEventListener('scroll', handleScroll);
        
        // 設定変更やリサイズ時に位置を再計算（ドラッグ中でなければ）
        if (!isDragging) {
             setCurrentPosition(calculateInitialPosition());
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [config, triggerElement, isDragging, memo]);

    // ドラッグ中のアクティブ化一時停止
    useEffect(() => {
        if (isDragging) {
            onPauseActivation('drag');
        } else {
            onResumeActivation('drag');
        }
    }, [isDragging, onPauseActivation, onResumeActivation]);

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

    // 現在のメモのRect（Ruler用）
    // 概算サイズ: 幅300, 高さ200（Memo.tsxのデフォルト値に近い値）
    // 正確なサイズを取得および反映するにはMemoからコールバックが必要だが、
    // まずはドラッグ中のガイドとしては現在のdragPositionと標準サイズで十分
    const currentMemoRect = {
        x: dragPosition.x,
        y: dragPosition.y,
        width: memo.positions[memo.urlPatterns[0]?.id ?? 'default']?.width ?? 300,
        height: memo.positions[memo.urlPatterns[0]?.id ?? 'default']?.height ?? 200,
    };

    return (
        <>
            {isDragging && (
                <Ruler
                    triggerRect={triggerElement.getBoundingClientRect()}
                    memoRect={currentMemoRect}
                    scroll={scroll}
                />
            )}
            
            <div
                ref={overlayRef}
                data-memo-id={memo.id}
                className="pageminder-activation-overlay"
                style={{
                    position: 'absolute', // 常にabsoluteでoverlayを配置（dragPositionは絶対座標）
                    left: `${dragPosition.x}px`,
                    top: `${dragPosition.y}px`,
                    zIndex: 2147483645,
                    width: 'fit-content', // 中身に合わせる
                    height: 'fit-content',
                }}
                onMouseEnter={() => onPauseActivation('hover-on-memo')}
                onMouseLeave={() => onResumeActivation('hover-on-memo')}
            >
                <MemoComponent
                    memo={memo}
                    settings={settings}
                    onUpdate={onUpdate}
                    onDelete={() => onClose()}
                    isActivated={true}
                    onPauseActivation={onPauseActivation}
                    onResumeActivation={onResumeActivation}
                    // ドラッグハンドラを渡す
                    activationDragHandle={handleMouseDown}
                />
            </div>
        </>
    );
}
