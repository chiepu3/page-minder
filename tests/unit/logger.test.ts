import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from '@/lib/logger';

describe('logger', () => {
    beforeEach(() => {
        // ログレベルをリセット
        logger.setLevel('debug');
        vi.clearAllMocks();
    });

    describe('setLevel / getLevel', () => {
        it('should set and get log level', () => {
            logger.setLevel('warn');
            expect(logger.getLevel()).toBe('warn');
        });
    });

    describe('debug', () => {
        it('should log when level is debug', () => {
            const spy = vi.spyOn(console, 'debug').mockImplementation(() => { });
            logger.setLevel('debug');
            logger.debug('test message');
            expect(spy).toHaveBeenCalled();
        });

        it('should not log when level is info', () => {
            const spy = vi.spyOn(console, 'debug').mockImplementation(() => { });
            logger.setLevel('info');
            logger.debug('test message');
            expect(spy).not.toHaveBeenCalled();
        });

        it('should log with data object', () => {
            const spy = vi.spyOn(console, 'debug').mockImplementation(() => { });
            logger.setLevel('debug');
            logger.debug('test message', { key: 'value' });
            expect(spy).toHaveBeenCalledWith(expect.stringContaining('test message'), { key: 'value' });
        });
    });

    describe('info', () => {
        it('should log when level is info or lower', () => {
            const spy = vi.spyOn(console, 'info').mockImplementation(() => { });
            logger.setLevel('info');
            logger.info('test info');
            expect(spy).toHaveBeenCalled();
        });

        it('should not log when level is warn', () => {
            const spy = vi.spyOn(console, 'info').mockImplementation(() => { });
            logger.setLevel('warn');
            logger.info('test info');
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('warn', () => {
        it('should log when level is warn or lower', () => {
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            logger.setLevel('warn');
            logger.warn('test warning');
            expect(spy).toHaveBeenCalled();
        });

        it('should not log when level is error', () => {
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            logger.setLevel('error');
            logger.warn('test warning');
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('error', () => {
        it('should always log at error level', () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
            logger.setLevel('error');
            logger.error('test error');
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('message formatting', () => {
        it('should include prefix in log message', () => {
            const spy = vi.spyOn(console, 'info').mockImplementation(() => { });
            logger.setLevel('info');
            logger.info('test');
            expect(spy).toHaveBeenCalledWith(expect.stringContaining('[PageMinder]'));
        });

        it('should include level in log message', () => {
            const spy = vi.spyOn(console, 'info').mockImplementation(() => { });
            logger.setLevel('info');
            logger.info('test');
            expect(spy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
        });
    });
});
