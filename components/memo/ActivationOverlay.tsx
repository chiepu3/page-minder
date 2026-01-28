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
    const [anchorPosition, setAnchorPosition] = useState({ x: 0, y: 0 });
    const overlayRef = useRef<HTMLDivElement>(null);
    const config = memo.activation;

    // 表示位置（アンカーポイント）を計算
    useEffect(() => {
        if (!config || config.positionMode !== 'near-element') return;

        const calculateAnchor = () => {
            const rect = triggerElement.getBoundingClientRect();
            // ターゲット要素の左上を基準点（アンカー）とする
            setAnchorPosition({
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY
            });
        };

        calculateAnchor();

        // スクロールやリサイズ時に再計算
        window.addEventListener('scroll', calculateAnchor);
        window.addEventListener('resize', calculateAnchor);

        return () => {
            window.removeEventListener('scroll', calculateAnchor);
            window.removeEventListener('resize', calculateAnchor);
        };
    }, [config?.positionMode, triggerElement]);

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
    }, [config?.highlightElement, config?.highlightColor, triggerElement]);

    if (!config) return null;

    // アクティブ化設定の更新（オフセットなど）
    const handleUpdateActivation = (updates: Partial<ActivationConfig>) => {
        onUpdate({
            ...memo,
            activation: {
                ...memo.activation!,
                ...updates
            }
        });
    };

    // near-elementモード: 指定されたオフセットまたはデフォルト（要素の右下）
    // デフォルト: 要素の右端+10px, 下端+10px
    // ここで計算するOffsetは、アンカー(左上)からの相対位置
    const getDefaultOffsets = () => {
        const rect = triggerElement.getBoundingClientRect();
        return {
            x: rect.width + 10,
            y: rect.height + 10
        };
    };

    const defaultOffsets = getDefaultOffsets();
    const effectiveOffsetX = config.offsetX ?? defaultOffsets.x;
    const effectiveOffsetY = config.offsetY ?? defaultOffsets.y;

    // fixed-positionモードの場合はメモ本来の絶対位置を使用するため、ここでのスタイルは最小限に
    // near-elementモードの場合はアンカー位置にwrapperを配置

    return (
        <div
            ref={overlayRef}
            data-memo-id={memo.id}
            className="pageminder-activation-overlay"
            style={{
                position: 'absolute', // 全体ドキュメントに対する絶対位置
                left: config.positionMode === 'near-element' ? `${anchorPosition.x}px` : '0px',
                top: config.positionMode === 'near-element' ? `${anchorPosition.y}px` : '0px',
                width: config.positionMode === 'near-element' ? '0px' : '100%', // ラッパー自体はサイズを持たない
                height: config.positionMode === 'near-element' ? '0px' : '100%',
                zIndex: 2147483645,
                pointerEvents: 'none', // ラッパー自体はイベントをブロックしない
            }}
            onMouseEnter={() => onPauseActivation('hover-on-memo')}
            onMouseLeave={() => onResumeActivation('hover-on-memo')}
        >
            <div style={{ pointerEvents: 'auto' }}>
                <MemoComponent
                    memo={memo}
                    settings={settings}
                    onUpdate={onUpdate}
                    onDelete={() => onClose()}
                    isActivated={true}
                    activationMode={config.positionMode}
                    activationOffset={{ x: effectiveOffsetX, y: effectiveOffsetY }}
                    onUpdateActivation={handleUpdateActivation}
                    onPauseActivation={onPauseActivation}
                    onResumeActivation={onResumeActivation}
                />
            </div>
        </div>
    );
}
