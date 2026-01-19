// =============================================================================
// PageMinder - Selector Generator Tests
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
    generateSelector,
    generateSelectorCandidates,
    validateSelector,
    getSelectorSpecificity,
} from '@/lib/selector-generator';

describe('selector-generator', () => {
    let document: Document;

    beforeEach(() => {
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        document = dom.window.document;
    });

    // =========================================================================
    // generateSelector
    // =========================================================================

    describe('generateSelector', () => {
        it('IDがある場合はIDセレクタを返す', () => {
            document.body.innerHTML = '<div id="unique-element">Test</div>';
            const element = document.getElementById('unique-element')!;

            const selector = generateSelector(element);

            expect(selector).toBe('#unique-element');
            expect(document.querySelector(selector)).toBe(element);
        });

        it('ユニークなclassがある場合はclassセレクタを返す', () => {
            document.body.innerHTML = `
                <div class="common another-class">First</div>
                <div class="unique-class">Target</div>
            `;
            const element = document.querySelector('.unique-class')!;

            const selector = generateSelector(element);

            expect(selector).toContain('.unique-class');
            expect(document.querySelector(selector)).toBe(element);
        });

        it('ユニークなclassがない場合はnth-childを使用する', () => {
            document.body.innerHTML = `
                <ul>
                    <li class="item">First</li>
                    <li class="item">Second</li>
                    <li class="item">Third</li>
                </ul>
            `;
            const element = document.querySelectorAll('.item')[1]; // 2番目の要素

            const selector = generateSelector(element);

            expect(document.querySelector(selector)).toBe(element);
        });

        it('data属性がある場合は優先的に使用する', () => {
            document.body.innerHTML = `
                <button data-testid="submit-button">Submit</button>
                <button data-testid="cancel-button">Cancel</button>
            `;
            const element = document.querySelector('[data-testid="submit-button"]')!;

            const selector = generateSelector(element);

            expect(selector).toContain('data-testid');
            expect(document.querySelector(selector)).toBe(element);
        });

        it('body要素自体にはbodyセレクタを返す', () => {
            const selector = generateSelector(document.body);

            expect(selector).toBe('body');
        });

        it('ネストした要素でもユニークなセレクタを生成する', () => {
            document.body.innerHTML = `
                <div class="container">
                    <div class="row">
                        <span class="label">Label 1</span>
                    </div>
                    <div class="row">
                        <span class="label">Label 2</span>
                    </div>
                </div>
            `;
            const elements = document.querySelectorAll('.label');

            const selector1 = generateSelector(elements[0]);
            const selector2 = generateSelector(elements[1]);

            expect(document.querySelector(selector1)).toBe(elements[0]);
            expect(document.querySelector(selector2)).toBe(elements[1]);
            expect(selector1).not.toBe(selector2);
        });
    });

    // =========================================================================
    // generateSelectorCandidates
    // =========================================================================

    describe('generateSelectorCandidates', () => {
        it('複数の候補セレクタを返す', () => {
            document.body.innerHTML = `
                <div id="container">
                    <button class="btn primary" data-action="submit">Submit</button>
                </div>
            `;
            const element = document.querySelector('button')!;

            const candidates = generateSelectorCandidates(element);

            expect(candidates.length).toBeGreaterThan(1);
            // すべての候補が対象要素を選択できることを確認
            candidates.forEach((selector) => {
                const selected = document.querySelector(selector);
                expect(selected).toBe(element);
            });
        });

        it('候補は優先度順（IDが最初）で返される', () => {
            document.body.innerHTML = `
                <div id="my-element" class="some-class">Test</div>
            `;
            const element = document.getElementById('my-element')!;

            const candidates = generateSelectorCandidates(element);

            // IDセレクタが最初
            expect(candidates[0]).toBe('#my-element');
        });
    });

    // =========================================================================
    // validateSelector
    // =========================================================================

    describe('validateSelector', () => {
        it('有効なセレクタでtrueを返す', () => {
            document.body.innerHTML = '<div id="test">Test</div>';

            expect(validateSelector('#test', document)).toBe(true);
            expect(validateSelector('div', document)).toBe(true);
            expect(validateSelector('.nonexistent', document)).toBe(true); // 構文は有効
        });

        it('無効なセレクタでfalseを返す', () => {
            expect(validateSelector('[[[invalid', document)).toBe(false);
            expect(validateSelector('#', document)).toBe(false);
            expect(validateSelector('', document)).toBe(false);
        });

        it('複合セレクタも検証できる', () => {
            expect(validateSelector('div.class#id[attr="value"]', document)).toBe(true);
            expect(validateSelector('div > span + p', document)).toBe(true);
        });
    });

    // =========================================================================
    // getSelectorSpecificity
    // =========================================================================

    describe('getSelectorSpecificity', () => {
        it('IDセレクタが最も高い優先度', () => {
            const idSpec = getSelectorSpecificity('#element');
            const classSpec = getSelectorSpecificity('.element');
            const tagSpec = getSelectorSpecificity('div');

            expect(idSpec).toBeGreaterThan(classSpec);
            expect(classSpec).toBeGreaterThan(tagSpec);
        });

        it('複合セレクタの優先度を計算できる', () => {
            const simple = getSelectorSpecificity('.class');
            const compound = getSelectorSpecificity('.class1.class2');

            expect(compound).toBeGreaterThan(simple);
        });
    });
});
