import { render, renderHook } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import type { Session } from '@supabase/supabase-js';
import { createMockSession } from './mocks/supabase';

// Re-export userEvent for convenient import in tests
export { userEvent };

// Re-export mock factories
export { createMockSession, createMockUser, createMockSupabaseClient } from './mocks/supabase';

/**
 * Default mock session for testing authenticated flows.
 */
export const defaultMockSession = createMockSession();

/**
 * Options for renderWithProviders
 */
export interface RenderOptions {
  /** Initial route to render */
  route?: string;
  /** Custom wrapper components */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /** Supabase session (null for unauthenticated) */
  session?: Session | null;
  /** Auth loading state */
  isAuthLoading?: boolean;
}

/**
 * Render a component with all necessary providers (Router, etc.)
 * Use this instead of raw `render` for component tests.
 */
export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const { route = '/', wrapper: CustomWrapper } = options;

  function Providers({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
  }

  const wrapper = CustomWrapper
    ? ({ children }: { children: React.ReactNode }) => (
        <CustomWrapper>
          <Providers>{children}</Providers>
        </CustomWrapper>
      )
    : Providers;

  const utils = render(ui, { wrapper });

  return {
    user: userEvent.setup(),
    ...utils,
  };
}

/**
 * Render a hook with provider context.
 */
export function renderHookWithProviders<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options: { initialProps?: TProps; route?: string } = {},
) {
  const { route = '/', initialProps } = options;

  function wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
  }

  return renderHook(hook, { wrapper, initialProps });
}

/**
 * Wait for a condition to be true with a timeout.
 * Useful for waiting on async state changes that aren't DOM updates.
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const { timeout = 1000, interval = 50 } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`waitForCondition timed out after ${timeout}ms`);
}
