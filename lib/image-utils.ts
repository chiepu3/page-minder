// =============================================================================
// PageMinder - Image Utilities
// =============================================================================

import { IMAGE_MAX_WIDTH, IMAGE_MAX_SIZE_BYTES, IMAGE_ALLOWED_TYPES, MEMO_IMG_PROTOCOL } from './constants';

export function resizeAndConvertToWebP(file: File | Blob, maxWidth: number = IMAGE_MAX_WIDTH): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas 2D context unavailable'));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert to WebP'));
                    }
                },
                'image/webp',
                0.85,
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

export function isImageFile(file: File): boolean {
    return IMAGE_ALLOWED_TYPES.includes(file.type);
}

export function validateImageSize(file: File | Blob, maxBytes: number = IMAGE_MAX_SIZE_BYTES): boolean {
    return file.size <= maxBytes;
}

export function extractImageIds(content: string): string[] {
    const ids: string[] = [];
    const regex = new RegExp(`\\!\\[.*?\\]\\(${escapeRegex(MEMO_IMG_PROTOCOL)}([\\w-]+)\\)`, 'g');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
        ids.push(match[1]);
    }
    return ids;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
