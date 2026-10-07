import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LivePreviewPane } from '../../../../../src/pages/cms/builder/LivePreviewPane';
import { createWrapper } from '../../../test-utils';

const DRAFT = 'https://exyconn.com/cms-preview?token=abc';

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type Props = Readonly<{ loadUrl: () => Promise<string>; version: number }>;

const mount = (props: Props) =>
  render(<LivePreviewPane {...props} />, { wrapper: createWrapper() });

const frame = () => screen.findByTitle('Live preview');

describe('LivePreviewPane', () => {
  it('shows a spinner, then the saved draft tagged with the save version', async () => {
    const loadUrl = vi.fn().mockResolvedValue(DRAFT);
    mount({ loadUrl, version: 0 });

    expect(screen.getByRole('region', { name: 'Live preview' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(await frame()).toHaveAttribute('src', `${DRAFT}&v=0-0`);
  });

  it('reloads after a save and on Refresh', async () => {
    const loadUrl = vi.fn().mockResolvedValue(DRAFT);
    const { rerender } = mount({ loadUrl, version: 0 });
    await frame();

    rerender(<LivePreviewPane loadUrl={loadUrl} version={3} />);
    expect(await frame()).toHaveAttribute('src', `${DRAFT}&v=3-0`);

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await frame()).toHaveAttribute('src', `${DRAFT}&v=3-1`);
    expect(loadUrl).toHaveBeenCalledTimes(3);
  });

  it('says why the preview could not load', async () => {
    mount({ loadUrl: vi.fn().mockRejectedValue(new Error('Preview link expired')), version: 0 });
    expect(await screen.findByText('Preview link expired')).toBeInTheDocument();
    expect(screen.queryByTitle('Live preview')).not.toBeInTheDocument();
  });

  it('falls back to a generic message for a failure without a reason', async () => {
    mount({ loadUrl: vi.fn().mockRejectedValue('offline'), version: 0 });
    expect(await screen.findByText('Could not load the preview')).toBeInTheDocument();
  });

  it('ignores an answer that arrives after a newer save', async () => {
    const stale = deferred<string>();
    const loadUrl = vi
      .fn()
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce(`${DRAFT}-new`);
    const { rerender } = mount({ loadUrl, version: 0 });
    rerender(<LivePreviewPane loadUrl={loadUrl} version={1} />);
    expect(await frame()).toHaveAttribute('src', `${DRAFT}-new&v=1-0`);

    await act(async () => {
      stale.resolve(`${DRAFT}-old`);
      await stale.promise;
    });
    expect(await frame()).toHaveAttribute('src', `${DRAFT}-new&v=1-0`);
  });

  it('ignores a failure that arrives after a newer save', async () => {
    const stale = deferred<string>();
    const loadUrl = vi.fn().mockReturnValueOnce(stale.promise).mockResolvedValueOnce(DRAFT);
    const { rerender } = mount({ loadUrl, version: 0 });
    rerender(<LivePreviewPane loadUrl={loadUrl} version={1} />);
    await frame();

    await act(async () => {
      stale.reject(new Error('Too late'));
      await stale.promise.catch(() => undefined);
    });
    expect(screen.queryByText('Too late')).not.toBeInTheDocument();
  });
});
