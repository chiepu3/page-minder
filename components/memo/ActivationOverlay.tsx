// =============================================================================
// PageMinder - Activation Overlay Component
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import type { Memo, ActivationConfig } from '@/types';
import { Memo as MemoComponent } from './Memo';
import type { GlobalSettings } from '@/types';

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
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const overlayRef = useRef<HTMLDivElement>(null);
    const config = memo.activation;

    // 表示位置を計算
    useEffect(() => {
        if (!config) return;

        const calculatePosition = () => {
            if (config.positionMode === 'near-element') {
                const rect = triggerElement.getBoundingClientRect();
                const offsetX = config.offsetX ?? 10;
                const offsetY = config.offsetY ?? 10;
                
                // 要素の右下に配置
                let x = rect.right + offsetX + window.scrollX;
                let y = rect.bottom + offsetY + window.scrollY;

                // 画面外にはみ出る場合は調整
                const overlayWidth = 300; // デフォルト幅
                const overlayHeight = 200; // デフォルト高さ
                
                if (x + overlayWidth > window.innerWidth + window.scrollX) {
                    x = rect.left - overlayWidth - offsetX + window.scrollX;
                }
                if (y + overlayHeight > window.innerHeight + window.scrollY) {
                    y = rect.top - overlayHeight - offsetY + window.scrollY;
                }

                setPosition({ x: Math.max(0, x), y: Math.max(0, y) });
            } else {
                // fixed-position: メモ本来の位置を使用
                const patternId = memo.urlPatterns[0]?.id ?? 'default';
                const memoPosition = memo.positions[patternId];
                if (memoPosition) {
                    setPosition({ x: memoPosition.x, y: memoPosition.y });
                }
            }
        };

        calculatePosition();

        // スクロールやリサイズ時に再計算
        window.addEventListener('scroll', calculatePosition);
        window.addEventListener('resize', calculatePosition);

        return () => {
            window.removeEventListener('scroll', calculatePosition);
            window.removeEventListener('resize', calculatePosition);
        };
    }, [config, triggerElement, memo]);

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

    return (
        <div
            ref={overlayRef}
            data-memo-id={memo.id}
            className="pageminder-activation-overlay"
            style={{
                position: config.positionMode === 'near-element' ? 'absolute' : 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 2147483645,
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
            />
        </div>
    );
}
