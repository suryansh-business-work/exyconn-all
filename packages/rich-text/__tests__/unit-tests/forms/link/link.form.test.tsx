import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LINK_MESSAGES, LinkForm } from '../../../../src/forms/link';

const BLANK_LINK = { href: '', openInNewTab: false };

const renderForm = (initial = BLANK_LINK) => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(<LinkForm initial={initial} onSubmit={onSubmit} onClose={onClose} />);
  return { onSubmit, onClose, url: screen.getByRole('textbox', { name: 'URL' }) };
};

describe('LinkForm', () => {
  it('requires a URL', async () => {
    const { onSubmit } = renderForm();
    expect(screen.getByRole('dialog', { name: 'Add link' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText(LINK_MESSAGES.required)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an address that is not a link, a path, mailto: or tel:', async () => {
    const { onSubmit, url } = renderForm();
    fireEvent.change(url, { target: { value: 'exyconn dot com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText(LINK_MESSAGES.invalid)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an address over 2048 characters', async () => {
    const { url } = renderForm();
    fireEvent.change(url, { target: { value: `https://x.test/${'a'.repeat(2040)}` } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('URL must be 2048 characters or fewer')).toBeInTheDocument();
  });

  it('submits a trimmed link that opens in a new tab', async () => {
    const user = userEvent.setup();
    const { onSubmit, url } = renderForm();
    await user.type(url, '  https://exyconn.com  ');
    await user.click(screen.getByRole('switch', { name: 'Open in a new tab' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { href: 'https://exyconn.com', openInNewTab: true },
        expect.anything(),
      ),
    );
  });

  it.each(['/about', 'mailto:hello@exyconn.com', 'tel:+1 (555) 010-2030'])(
    'accepts %s',
    async (href) => {
      const { onSubmit, url } = renderForm();
      fireEvent.change(url, { target: { value: href } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({ href, openInNewTab: false }, expect.anything()),
      );
    },
  );

  it('edits an existing link and can be cancelled', async () => {
    const { onClose, url } = renderForm({ href: 'https://old.test', openInNewTab: true });
    expect(screen.getByRole('dialog', { name: 'Edit link' })).toBeInTheDocument();
    expect(url).toHaveValue('https://old.test');
    expect(screen.getByRole('switch', { name: 'Open in a new tab' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
