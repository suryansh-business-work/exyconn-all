import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { formatWith } from '@exyconn/shell/utils/date';
import { CheckTicketForm } from '../../../../src/pages/help/forms/check-ticket';
import { TIME_FORMAT } from '../../../../src/status.constants';
import { renderWithProviders } from '../../test-utils';
import { fill, findSnackbar } from '../../form-helpers';
import { EMAIL, REFERENCE, lookedUp, refusedLookup, ticket } from './help.fixtures';

const NO_MATCH = 'No ticket matches that reference and address. Check both and try again.';

function renderForm(mocks: MockLink.MockedResponse[] = []) {
  const onCancel = vi.fn<() => void>();
  renderWithProviders(<CheckTicketForm onCancel={onCancel} />, { mocks });
  return { onCancel };
}

async function check(reference = REFERENCE, email = EMAIL) {
  fill('Ticket reference', reference);
  fill('Your email', email);
  await userEvent.click(screen.getByRole('button', { name: 'Check' }));
}

describe('CheckTicketForm', () => {
  it('needs both the reference and the address', async () => {
    renderForm();
    await check('EX', '');
    expect(await screen.findByText('The reference from your confirmation')).toBeInTheDocument();
    expect(screen.getByText('The address you raised it from')).toBeInTheDocument();
  });

  it('refuses an address that is not an email', async () => {
    renderForm();
    await check(REFERENCE, 'ada@');
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
  });

  it('shows the ticket and its public replies, forgiving case and spaces in the reference', async () => {
    const found = ticket({
      replies: [
        {
          __typename: 'SupportReply',
          id: 'r1',
          body: 'We are on it.',
          authorName: '',
          createdAt: '2026-09-05T09:00:00.000Z',
        },
        {
          __typename: 'SupportReply',
          id: 'r2',
          body: 'Sent again.',
          authorName: 'Grace',
          createdAt: '2026-09-05T10:00:00.000Z',
        },
      ],
    });
    renderForm([lookedUp(found)]);
    await check(' exy-abc234 ');

    expect(await screen.findByText(REFERENCE)).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('Payslip is missing')).toBeInTheDocument();
    expect(
      screen.getByText(`Last updated ${formatWith(found.updatedAt, TIME_FORMAT)}`),
    ).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Grace')).toBeInTheDocument();
    expect(screen.getByText('We are on it.')).toBeInTheDocument();
    expect(
      screen.getByText(formatWith('2026-09-05T10:00:00.000Z', TIME_FORMAT)),
    ).toBeInTheDocument();
  });

  it('says nobody has replied yet on a quiet ticket', async () => {
    renderForm([lookedUp(ticket())]);
    await check();
    expect(
      await screen.findByText('Nobody has replied yet. You will get an email when they do.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(NO_MATCH)).not.toBeInTheDocument();
  });

  it('gives one answer for an unknown ticket and for somebody else’s', async () => {
    renderForm([lookedUp(null)]);
    await check();
    expect(await screen.findByText(NO_MATCH)).toBeInTheDocument();
    expect(screen.queryByText('Last updated', { exact: false })).not.toBeInTheDocument();
  });

  it('reports a failed lookup without showing a stale answer', async () => {
    renderForm([lookedUp(ticket()), lookedUp(new Error('Lookup is rate limited'))]);
    await check();
    expect(await screen.findByText('Payslip is missing')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(await findSnackbar('Lookup is rate limited')).toBeInTheDocument();
    expect(screen.queryByText('Payslip is missing')).not.toBeInTheDocument();
    expect(screen.queryByText(NO_MATCH)).not.toBeInTheDocument();
  });

  it('reports a GraphQL error the server answered with', async () => {
    renderForm([refusedLookup('Lookup refused')]);
    await check();
    expect(await findSnackbar('Lookup refused')).toBeInTheDocument();
    expect(screen.queryByText(NO_MATCH)).not.toBeInTheDocument();
  });

  it('cancels on request', async () => {
    const { onCancel } = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
