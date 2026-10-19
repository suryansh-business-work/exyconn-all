import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskVisibility } from '@exyconn/shell/graphql/generated';
import { TicketDetailsPanel } from '../../../../src/pages/browse/TicketDetailsPanel';
import { renderWithProviders } from '../../test-utils';
import { pickOption } from '../../helpers/form-helpers';
import { COLUMNS, pageTicket } from './browse-fixtures';

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `at ${value}` }),
}));

const LINK = 'https://status.exyconn.com/ticket/abc';

function renderPanel(
  ticket = pageTicket(),
  epic: { key: string; title: string } | null = null,
  switching = false,
) {
  const handlers = { onMove: vi.fn(), onVisibility: vi.fn(), onCopy: vi.fn() };
  renderWithProviders(
    <TicketDetailsPanel
      ticket={ticket}
      columns={COLUMNS}
      epic={epic}
      switching={switching}
      {...handlers}
    />,
  );
  return handlers;
}

/** The value written under a fact's label. */
const factValue = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

describe('TicketDetailsPanel', () => {
  it('sets out the facts, filling the blanks in words', () => {
    renderPanel(pageTicket({ reporterName: '', assigneeName: '' }));

    expect(factValue('Epic')).toBe('None');
    expect(factValue('Assignee')).toBe('Unassigned');
    expect(factValue('Reporter')).toBe('somebody who has left');
    expect(factValue('Created')).toBe(`at ${pageTicket().createdAt}`);
    expect(factValue('Updated')).toBe(`at ${pageTicket().updatedAt}`);
    expect(screen.queryByRole('button', { name: 'Copy public link' })).not.toBeInTheDocument();
  });

  it('links the epic and names the people', () => {
    renderPanel(pageTicket({ reporterName: 'Asha Rao', assigneeName: 'Priya' }), {
      key: 'EXY-9',
      title: 'Checkout',
    });

    expect(screen.getByRole('link', { name: 'EXY-9 · Checkout' })).toHaveAttribute(
      'href',
      '/projects/browse/EXY-9',
    );
    expect(factValue('Assignee')).toBe('Priya');
    expect(factValue('Reporter')).toBe('Asha Rao');
  });

  it('moves the ticket to the column picked', async () => {
    const { onMove } = renderPanel();

    await pickOption(/Column/, 'Done');

    expect(onMove).toHaveBeenCalledWith('done');
  });

  it('switches visibility and copies the public link', async () => {
    const { onVisibility, onCopy } = renderPanel(
      pageTicket({ visibility: TaskVisibility.Public, publicUrl: LINK }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Private' }));
    await userEvent.click(screen.getByRole('button', { name: 'Copy public link' }));

    expect(onVisibility).toHaveBeenCalledWith(TaskVisibility.Private);
    expect(onCopy).toHaveBeenCalledWith(LINK);
  });

  it('locks visibility while a switch runs, and treats a missing link as none', () => {
    renderPanel(pageTicket({ publicUrl: undefined }), null, true);

    expect(screen.getByRole('button', { name: 'Public' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Copy public link' })).not.toBeInTheDocument();
  });
});
