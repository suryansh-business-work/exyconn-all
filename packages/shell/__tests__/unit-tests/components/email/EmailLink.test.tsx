import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { closeDockPanel, useDock } from '@/components/compose-dock';
import { EmailActionProvider, EmailLink } from '@/components/email';
import { renderWithProviders } from '../../test-utils';

const ADDRESS = 'ada@acme.io';

describe('EmailLink', () => {
  afterEach(() => {
    closeDockPanel(`email:${ADDRESS}`);
  });

  it('opens the email window addressed to it, without clicking what is around it', async () => {
    const onRow = vi.fn();
    renderWithProviders(
      <div role="presentation" onClick={onRow}>
        <EmailLink address={` ${ADDRESS} `} />
      </div>,
    );

    await userEvent.click(screen.getByRole('button', { name: `Email ${ADDRESS}` }));

    const { result } = renderHook(() => useDock());
    expect(result.current.panels).toMatchObject([
      { key: `email:${ADDRESS}`, title: 'Email', subject: ADDRESS, data: { to: [ADDRESS] } },
    ]);
    expect(onRow).not.toHaveBeenCalled();
  });

  it('does what a provider says instead, and what its own prop says before that', async () => {
    const provided = vi.fn();
    const own = vi.fn();
    renderWithProviders(
      <EmailActionProvider onEmail={provided}>
        <EmailLink address={ADDRESS}>Ada</EmailLink>
        <EmailLink address="b@acme.io" onEmail={own} />
      </EmailActionProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: `Email ${ADDRESS}` }));
    await userEvent.click(screen.getByRole('button', { name: 'Email b@acme.io' }));

    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(provided).toHaveBeenCalledWith(ADDRESS);
    expect(own).toHaveBeenCalledWith('b@acme.io');
  });

  it('draws nothing for a blank or missing address', () => {
    const { container } = renderWithProviders(
      <>
        <EmailLink address="  " />
        <EmailLink address={null} />
      </>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
