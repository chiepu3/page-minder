// =============================================================================
// PageMinder - Resizable Hook
// =============================================================================

import { useState, useCallback, useEffect } from 'react';

interface Size {
    width: number;
    height: number;
}

interface UseResizableOptions {
    initialSize: Size;
    minSize?: Size;
    maxSize?: Size;
    onSizeChange?: (size: Size) => void;
}

interface UseResizableReturn {
    size: Size;
    handleMouseDown: (e: React.MouseEvent) => void;
    isResizing: boolean;
}

/**
 * リサイズ機能を提供するフック
 */
export function useResizable({
    initialSize,
    minSize = { width: 100, height: 100 },
    maxSize = { width: 1000, height: 800 },
    onSizeChange,
}: UseResizableOptions): UseResizableReturn {
    const [size, setSize] = useState<Size>(initialSize);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
    const [sizeStart, setSizeStart] = useState<Size>({ width: 0, height: 0 });

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
            setResizeStart({ x: e.clientX, y: e.clientY });
            setSizeStart(size);
        },
        [size]
    );

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;

            const newWidth = Math.min(
                Math.max(sizeStart.width + deltaX, minSize.width),
                maxSize.width
            );
            const newHeight = Math.min(
                Math.max(sizeStart.height + deltaY, minSize.height),
                maxSize.height
            );

            setSize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            onSizeChange?.(size);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resizeStart, sizeStart, minSize, maxSize, onSizeChange, size]);

    // 初期サイズが変更されたら追従
    useEffect(() => {
        setSize(initialSize);
    }, [initialSize.width, initialSize.height]);

    return {
        size,
        handleMouseDown,
        isResizing,
    };
}
