import { describe, it, expect } from 'vitest';
import {
    PASTEL_COLORS,
    COLOR_PALETTE,
    DEFAULT_SETTINGS,
    DEFAULT_MEMO_SIZE,
    MINIMIZED_SIZE,
    MIN_MEMO_SIZE,
    MAX_MEMO_SIZE,
    DEFAULT_HOVER_DELAY,
    DEFAULT_HIGHLIGHT_COLOR,
    SHADOW_ROOT_NAME,
    STORAGE_KEYS,
    EXPORT_VERSION,
} from '@/lib/constants';

describe('constants', () => {
    describe('PASTEL_COLORS', () => {
        it('should have 8 colors', () => {
            expect(Object.keys(PASTEL_COLORS)).toHaveLength(8);
        });

        it('should have valid hex colors', () => {
            const hexPattern = /^#[0-9A-Fa-f]{6}$/;
            Object.values(PASTEL_COLORS).forEach((color) => {
                expect(color).toMatch(hexPattern);
            });
        });

        it('should have yellow as default', () => {
            expect(PASTEL_COLORS.yellow).toBe('#FFFFA5');
        });
    });

    describe('COLOR_PALETTE', () => {
        it('should be an array of colors', () => {
            expect(Array.isArray(COLOR_PALETTE)).toBe(true);
            expect(COLOR_PALETTE.length).toBe(8);
        });
    });

    describe('DEFAULT_SETTINGS', () => {
        it('should have correct default font size', () => {
            expect(DEFAULT_SETTINGS.defaultFontSize).toBe(14);
        });

        it('should have yellow as default background color', () => {
            expect(DEFAULT_SETTINGS.defaultBackgroundColor).toBe('#FFFFA5');
        });

        it('should have dark text color', () => {
            expect(DEFAULT_SETTINGS.defaultTextColor).toBe('#333333');
        });

        it('should have info as default log level', () => {
            expect(DEFAULT_SETTINGS.logLevel).toBe('info');
        });

        it('should have history disabled by default', () => {
            expect(DEFAULT_SETTINGS.enableHistory).toBe(false);
        });
    });

    describe('size constants', () => {
        it('DEFAULT_MEMO_SIZE should have width and height', () => {
            expect(DEFAULT_MEMO_SIZE.width).toBeGreaterThan(0);
            expect(DEFAULT_MEMO_SIZE.height).toBeGreaterThan(0);
        });

        it('MINIMIZED_SIZE should be smaller than DEFAULT_MEMO_SIZE', () => {
            expect(MINIMIZED_SIZE.width).toBeLessThan(DEFAULT_MEMO_SIZE.width);
            expect(MINIMIZED_SIZE.height).toBeLessThan(DEFAULT_MEMO_SIZE.height);
        });

        it('MIN_MEMO_SIZE should be less than MAX_MEMO_SIZE', () => {
            expect(MIN_MEMO_SIZE.width).toBeLessThan(MAX_MEMO_SIZE.width);
            expect(MIN_MEMO_SIZE.height).toBeLessThan(MAX_MEMO_SIZE.height);
        });
    });

    describe('activation constants', () => {
        it('DEFAULT_HOVER_DELAY should be reasonable', () => {
            expect(DEFAULT_HOVER_DELAY).toBeGreaterThanOrEqual(100);
            expect(DEFAULT_HOVER_DELAY).toBeLessThanOrEqual(2000);
        });

        it('DEFAULT_HIGHLIGHT_COLOR should be valid rgba', () => {
            expect(DEFAULT_HIGHLIGHT_COLOR).toMatch(/^rgba?\(/);
        });
    });

    describe('other constants', () => {
        it('SHADOW_ROOT_NAME should be a non-empty string', () => {
            expect(typeof SHADOW_ROOT_NAME).toBe('string');
            expect(SHADOW_ROOT_NAME.length).toBeGreaterThan(0);
        });

        it('STORAGE_KEYS should have required keys', () => {
            expect(STORAGE_KEYS.MEMOS).toBe('memos');
            expect(STORAGE_KEYS.SETTINGS).toBe('settings');
            expect(STORAGE_KEYS.URL_PATTERN_PRESETS).toBe('urlPatternPresets');
        });

        it('EXPORT_VERSION should be a valid semver', () => {
            expect(EXPORT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
        });
    });
});
