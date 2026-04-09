import { setupWorker } from 'msw/browser';
import { supabaseHandlers } from './mocks/handlers';

/**
 * MSW browser worker for integration tests.
 * This is used by the test setup to intercept network requests.
 */
export const worker = setupWorker(...supabaseHandlers);
