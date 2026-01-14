import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock chrome API
const mockChrome = {
    storage: {
        local: {
            get: vi.fn(),
            set: vi.fn(),
        },
    },
    runtime: {
        sendMessage: vi.fn(),
        onMessage: {
            addListener: vi.fn(),
        },
    },
};

vi.stubGlobal('chrome', mockChrome);
