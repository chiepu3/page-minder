import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// A separate Node process is needed for each case: the dependency is native ESM
// and its exported API object is intentionally selected once at module load.
describe('WXT extension API compatibility', () => {
    it.each([
        ['without a browser global', 'undefined', 'chromeApi'],
        ['with an unrelated browser global', '{ runtime: {} }', 'chromeApi'],
        ['with an extension browser global', 'browserApi', 'browserApi'],
    ])('selects the expected existing API object %s', (_label, browserGlobal, expected) => {
        const output = execFileSync(process.execPath, ['--input-type=module', '--eval', `
            import assert from 'node:assert/strict';
            const chromeApi = { runtime: { id: 'synthetic-chrome-extension' } };
            const browserApi = { runtime: { id: 'synthetic-browser-extension' } };
            globalThis.chrome = chromeApi;
            globalThis.browser = ${browserGlobal};
            const { browser } = await import('wxt/browser');
            assert.equal(browser, ${expected});
            process.stdout.write('OK');
        `], { encoding: 'utf8' });

        expect(output).toBe('OK');
    });
});
