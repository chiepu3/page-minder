import { describe, it, expect } from 'vitest';
import {
    matchWildcard,
    matchRegex,
    matchUrlPattern,
    matchAnyUrlPattern,
    findMatchingPatterns,
    isValidRegex,
    isValidUrlPattern,
    inferPatternType,
    generatePatternFromUrl,
} from '@/lib/url-matcher';
import type { UrlPattern } from '@/types';

describe('url-matcher', () => {
    describe('matchWildcard', () => {
        it('should match exact URL', () => {
            expect(matchWildcard('https://example.com/page', 'https://example.com/page')).toBe(true);
        });

        it('should match wildcard at end', () => {
            expect(matchWildcard('https://example.com/path/to/page', 'https://example.com/*')).toBe(true);
        });

        it('should match wildcard in middle', () => {
            expect(matchWildcard('https://example.com/users/123/profile', 'https://example.com/users/*/profile')).toBe(true);
        });

        it('should match multiple wildcards', () => {
            expect(matchWildcard('https://example.com/a/b/c/d', 'https://example.com/*/*/c/*')).toBe(true);
        });

        it('should not match when pattern does not match', () => {
            expect(matchWildcard('https://example.com/other', 'https://example.com/page')).toBe(false);
        });

        it('should escape special regex characters', () => {
            expect(matchWildcard('https://example.com/page?query=1', 'https://example.com/page?query=*')).toBe(true);
        });
    });

    describe('matchRegex', () => {
        it('should match regex pattern', () => {
            expect(matchRegex('https://example.com/users/123', '^https://example\\.com/users/\\d+$')).toBe(true);
        });

        it('should not match when regex does not match', () => {
            expect(matchRegex('https://example.com/users/abc', '^https://example\\.com/users/\\d+$')).toBe(false);
        });

        it('should return false for invalid regex', () => {
            expect(matchRegex('https://example.com', '[[invalid')).toBe(false);
        });
    });

    describe('matchUrlPattern', () => {
        it('should match wildcard pattern', () => {
            const pattern: UrlPattern = {
                id: '1',
                type: 'wildcard',
                pattern: 'https://example.com/*',
            };
            expect(matchUrlPattern('https://example.com/page', pattern)).toBe(true);
        });

        it('should match regex pattern', () => {
            const pattern: UrlPattern = {
                id: '1',
                type: 'regex',
                pattern: '^https://example\\.com/\\d+$',
            };
            expect(matchUrlPattern('https://example.com/123', pattern)).toBe(true);
        });
    });

    describe('matchAnyUrlPattern', () => {
        const patterns: UrlPattern[] = [
            { id: '1', type: 'wildcard', pattern: 'https://example.com/*' },
            { id: '2', type: 'wildcard', pattern: 'https://other.com/*' },
        ];

        it('should return true if any pattern matches', () => {
            expect(matchAnyUrlPattern('https://example.com/page', patterns)).toBe(true);
        });

        it('should return false if no pattern matches', () => {
            expect(matchAnyUrlPattern('https://nomatch.com/page', patterns)).toBe(false);
        });

        it('should return false for empty patterns array', () => {
            expect(matchAnyUrlPattern('https://example.com', [])).toBe(false);
        });
    });

    describe('findMatchingPatterns', () => {
        const patterns: UrlPattern[] = [
            { id: '1', type: 'wildcard', pattern: 'https://example.com/*' },
            { id: '2', type: 'wildcard', pattern: 'https://example.com/specific/*' },
            { id: '3', type: 'wildcard', pattern: 'https://other.com/*' },
        ];

        it('should return all matching patterns', () => {
            const result = findMatchingPatterns('https://example.com/specific/page', patterns);
            expect(result).toHaveLength(2);
            expect(result.map(p => p.id)).toContain('1');
            expect(result.map(p => p.id)).toContain('2');
        });

        it('should return empty array when no patterns match', () => {
            const result = findMatchingPatterns('https://nomatch.com', patterns);
            expect(result).toHaveLength(0);
        });
    });

    describe('isValidRegex', () => {
        it('should return true for valid regex', () => {
            expect(isValidRegex('^https://.*$')).toBe(true);
        });

        it('should return false for invalid regex', () => {
            expect(isValidRegex('[[invalid')).toBe(false);
        });
    });

    describe('isValidUrlPattern', () => {
        it('should return true for valid wildcard pattern', () => {
            const pattern: UrlPattern = { id: '1', type: 'wildcard', pattern: 'https://*' };
            expect(isValidUrlPattern(pattern)).toBe(true);
        });

        it('should return true for valid regex pattern', () => {
            const pattern: UrlPattern = { id: '1', type: 'regex', pattern: '^https://.*$' };
            expect(isValidUrlPattern(pattern)).toBe(true);
        });

        it('should return false for invalid regex pattern', () => {
            const pattern: UrlPattern = { id: '1', type: 'regex', pattern: '[[invalid' };
            expect(isValidUrlPattern(pattern)).toBe(false);
        });

        it('should return false for empty pattern', () => {
            const pattern: UrlPattern = { id: '1', type: 'wildcard', pattern: '' };
            expect(isValidUrlPattern(pattern)).toBe(false);
        });

        it('should return false for whitespace-only pattern', () => {
            const pattern: UrlPattern = { id: '1', type: 'wildcard', pattern: '   ' };
            expect(isValidUrlPattern(pattern)).toBe(false);
        });
    });

    describe('inferPatternType', () => {
        it('should infer wildcard for simple patterns', () => {
            expect(inferPatternType('https://example.com/*')).toBe('wildcard');
        });

        it('should infer regex for patterns with regex characters', () => {
            expect(inferPatternType('^https://example\\.com/\\d+$')).toBe('regex');
        });
    });

    describe('generatePatternFromUrl', () => {
        it('should generate pattern from URL', () => {
            const result = generatePatternFromUrl('https://example.com/users/123');
            expect(result).toBe('https://example.com/users/*');
        });

        it('should handle root URL', () => {
            const result = generatePatternFromUrl('https://example.com/');
            expect(result).toBe('https://example.com/*');
        });

        it('should return original for invalid URL', () => {
            const result = generatePatternFromUrl('not-a-url');
            expect(result).toBe('not-a-url');
        });
    });
});
