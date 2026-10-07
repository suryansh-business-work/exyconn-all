import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadMenu } from '../../../src';

const labels = { button: 'Download', pdf: 'PDF document', docx: 'Word document' };

afterEach(() => {
  vi.restoreAllMocks();
});

const openMenu = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Download' }));
  return { user, menu: await screen.findByRole('menu') };
};

describe('DownloadMenu', () => {
  it('offers both formats and passes the chosen one, busy until it settles', async () => {
    let finish: () => void = () => undefined;
    const onSelect = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<DownloadMenu labels={labels} onSelect={onSelect} />);
    const button = screen.getByRole('button', { name: 'Download' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    const { user, menu } = await openMenu();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(within(menu).getByText('PDF document')).toBeInTheDocument();
    await user.click(within(menu).getByText('Word document'));

    expect(onSelect).toHaveBeenCalledWith('docx');
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await act(async () => finish());
    expect(button).toBeEnabled();
  });

  it('logs a failed download and becomes usable again', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onSelect = vi.fn(async () => {
      throw new Error('Image refused');
    });
    render(<DownloadMenu labels={labels} onSelect={onSelect} />);
    const { user, menu } = await openMenu();
    await user.click(within(menu).getByText('PDF document'));

    expect(onSelect).toHaveBeenCalledWith('pdf');
    await waitFor(() => expect(error).toHaveBeenCalledWith('Download failed', expect.any(Error)));
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  });

  it('closes without downloading when dismissed, and can be disabled', async () => {
    const onSelect = vi.fn(async () => undefined);
    const { rerender } = render(<DownloadMenu labels={labels} onSelect={onSelect} />);
    const { user } = await openMenu();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(onSelect).not.toHaveBeenCalled();

    rerender(<DownloadMenu labels={labels} onSelect={onSelect} disabled />);
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
  });
});
