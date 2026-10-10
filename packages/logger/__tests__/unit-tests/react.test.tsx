// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Logger } from '../../src';
import { LogErrorBoundary } from '../../src/react';

const crash = { on: true };

function Settings() {
  if (crash.on) {
    throw new TypeError('settings is undefined');
  }
  return <p>Settings page</p>;
}

function Fallback({ error, reset }: Readonly<{ error: Error; reset: () => void }>) {
  return (
    <div role="alert">
      <p>{error.message}</p>
      <button type="button" onClick={reset}>
        Retry
      </button>
    </div>
  );
}

function setup() {
  const capture = vi.fn();
  const logger = { capture } as unknown as Logger;
  render(
    <LogErrorBoundary
      logger={logger}
      fallback={(error, reset) => <Fallback error={error} reset={reset} />}
    >
      <Settings />
    </LogErrorBoundary>,
  );
  return { capture, logger };
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  crash.on = true;
});

describe('LogErrorBoundary', () => {
  it('renders its children when nothing throws', () => {
    crash.on = false;
    const { capture } = setup();
    expect(screen.getByText('Settings page')).toBeInTheDocument();
    expect(capture).not.toHaveBeenCalled();
  });

  it('shows the fallback with the error and sends it with the component stack', () => {
    const { capture } = setup();
    expect(screen.getByRole('alert')).toHaveTextContent('settings is undefined');
    expect(capture).toHaveBeenCalledTimes(1);
    const [error, options] = capture.mock.calls[0];
    expect(error).toBeInstanceOf(TypeError);
    expect(options.componentStack).toEqual(expect.stringContaining('Settings'));
  });

  it('renders the children again after reset once they stop throwing', () => {
    setup();
    crash.on = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByText('Settings page')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sends a null component stack when React gives none', () => {
    const capture = vi.fn();
    const error = new Error('no stack');
    const boundary = new LogErrorBoundary({
      logger: { capture } as unknown as Logger,
      fallback: () => null,
      children: null,
    });
    boundary.componentDidCatch(error, {});
    expect(capture).toHaveBeenCalledWith(error, { componentStack: null });
  });
});
