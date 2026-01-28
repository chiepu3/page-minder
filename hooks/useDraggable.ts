// =============================================================================
// PageMinder - Draggable Hook
// =============================================================================

import { useState, useCallback, useEffect } from 'react';

interface Position {
    x: number;
    y: number;
}

interface UseDraggableOptions {
    initialPosition: Position;
    onPositionChange?: (position: Position) => void;
    disabled?: boolean;
}

interface UseDraggableReturn {
    position: Position;
    handleMouseDown: (e: React.MouseEvent) => void;
    isDragging: boolean;
}

/**
 * ドラッグ機能を提供するフック
 */
export function useDraggable({
    initialPosition,
    onPositionChange,
    disabled = false,
}: UseDraggableOptions): UseDraggableReturn {
    const [position, setPosition] = useState<Position>(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
    const [positionStart, setPositionStart] = useState<Position>({ x: 0, y: 0 });

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (disabled) return;

            // ボタンやインタラクティブな要素からのイベントは無視
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.closest('button')) return;

            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            setPositionStart(position);
        },
        [disabled, position]
    );

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;

            const newPosition = {
                x: Math.max(0, positionStart.x + deltaX),
                y: Math.max(0, positionStart.y + deltaY),
            };

            setPosition(newPosition);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            onPositionChange?.(position);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, positionStart, onPositionChange, position]);

    // 初期位置が変更されたら追従
    useEffect(() => {
        setPosition(initialPosition);
    }, [initialPosition.x, initialPosition.y]);

    return {
        position,
        handleMouseDown,
        isDragging,
    };
}
