// =============================================================================
// PageMinder - Element Picker Component
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateSelectorCandidates } from '@/lib/selector-generator';

interface ElementPickerProps {
    onSelect: (selector: string) => void;
    onCancel: () => void;
}

/**
 * AdBlock風の要素選択インターフェース
 * フルスクリーンオーバーレイで要素をハイライトし、クリックで選択
 */
export function ElementPicker({ onSelect, onCancel }: ElementPickerProps) {
    const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
    const [selectorCandidates, setSelectorCandidates] = useState<string[]>([]);
    const [selectedSelectorIndex, setSelectedSelectorIndex] = useState(0);
    const [showCandidates, setShowCandidates] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    // マウス移動で要素をハイライト
    const handleMouseMove = useCallback((e: MouseEvent) => {
        // Shadow DOM内の要素を除外
        const target = e.target as Element;
        if (!target || target.closest('[data-pageminder-picker]')) {
            return;
        }

        // PageMinderのUI要素を除外
        if (target.closest('.pageminder-container') || target.closest('.pageminder-memo')) {
            return;
        }

        if (target !== highlightedElement) {
            setHighlightedElement(target);
        }
    }, [highlightedElement]);

    // クリックで要素を選択
    const handleClick = useCallback((e: MouseEvent) => {
        // 候補選択中はdocumentクリックを無視（ボタンのonClickに任せる）
        if (showCandidates) {
            return;
        }

        const target = e.target as Element;
        
        // ピッカーUI内のクリックは無視
        if (target.closest('[data-pageminder-picker]')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (highlightedElement) {
            const candidates = generateSelectorCandidates(highlightedElement);
            if (candidates.length > 0) {
                setSelectorCandidates(candidates);
                setSelectedSelectorIndex(0);
                setShowCandidates(true);
            }
        }
    }, [highlightedElement, showCandidates]);

    // ESCでキャンセル
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (showCandidates) {
                setShowCandidates(false);
            } else {
                onCancel();
            }
        }
    }, [showCandidates, onCancel]);

    // イベントリスナーの設定
    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('keydown', handleKeyDown, true);

        // カーソルを変更
        document.body.style.cursor = 'crosshair';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove, true);
            document.removeEventListener('click', handleClick, true);
            document.removeEventListener('keydown', handleKeyDown, true);
            document.body.style.cursor = '';
        };
    }, [handleMouseMove, handleClick, handleKeyDown]);

    // ハイライト位置の更新
    useEffect(() => {
        if (highlightedElement && highlightRef.current && !showCandidates) {
            const rect = highlightedElement.getBoundingClientRect();
            const highlight = highlightRef.current;
            highlight.style.top = `${rect.top + window.scrollY}px`;
            highlight.style.left = `${rect.left + window.scrollX}px`;
            highlight.style.width = `${rect.width}px`;
            highlight.style.height = `${rect.height}px`;
            highlight.style.display = 'block';
        } else if (highlightRef.current) {
            highlightRef.current.style.display = 'none';
        }
    }, [highlightedElement, showCandidates]);

    // セレクタ確定
    const handleConfirm = () => {
        if (selectorCandidates[selectedSelectorIndex]) {
            onSelect(selectorCandidates[selectedSelectorIndex]);
        }
    };

    return (
        <>
            {/* 半透明オーバーレイ */}
            <div
                ref={overlayRef}
                data-pageminder-picker
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    zIndex: 2147483646,
                    pointerEvents: showCandidates ? 'auto' : 'none',
                }}
            />

            {/* ハイライトボックス */}
            <div
                ref={highlightRef}
                data-pageminder-picker
                style={{
                    position: 'absolute',
                    border: '2px solid #4a90d9',
                    backgroundColor: 'rgba(74, 144, 217, 0.2)',
                    pointerEvents: 'none',
                    zIndex: 2147483647,
                    display: 'none',
                    boxSizing: 'border-box',
                }}
            />

            {/* 候補選択UI */}
            {showCandidates && (
                <div
                    data-pageminder-picker
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#1e1e1e',
                        borderRadius: '8px',
                        padding: '16px',
                        zIndex: 2147483647,
                        minWidth: '400px',
                        maxWidth: '600px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        color: '#fff',
                        fontFamily: 'system-ui, sans-serif',
                    }}
                >
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
                        セレクタを選択
                    </h3>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#888' }}>
                        以下から最適なセレクタを選んでください
                    </p>

                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {selectorCandidates.map((selector, index) => (
                            <label
                                key={selector}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    backgroundColor: selectedSelectorIndex === index ? '#333' : 'transparent',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginBottom: '4px',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="selector"
                                    checked={selectedSelectorIndex === index}
                                    onChange={() => setSelectedSelectorIndex(index)}
                                    style={{ marginRight: '12px' }}
                                />
                                <code style={{
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all',
                                    color: '#4fc3f7',
                                }}>
                                    {selector}
                                </code>
                            </label>
                        ))}
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px',
                        marginTop: '16px',
                    }}>
                        <button
                            onClick={() => {
                                setShowCandidates(false);
                                setSelectorCandidates([]);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'transparent',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                color: '#ccc',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }}
                        >
                            戻る
                        </button>
                        <button
                            onClick={onCancel}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'transparent',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                color: '#ccc',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }}
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleConfirm}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#4a90d9',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                            }}
                        >
                            選択
                        </button>
                    </div>
                </div>
            )}

            {/* 説明ツールチップ */}
            {!showCandidates && (
                <div
                    data-pageminder-picker
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#1e1e1e',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        zIndex: 2147483647,
                        color: '#fff',
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: '14px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    }}
                >
                    <span style={{ marginRight: '16px' }}>
                        🎯 要素をクリックして選択
                    </span>
                    <span style={{ color: '#888' }}>
                        ESCでキャンセル
                    </span>
                </div>
            )}
        </>
    );
}
