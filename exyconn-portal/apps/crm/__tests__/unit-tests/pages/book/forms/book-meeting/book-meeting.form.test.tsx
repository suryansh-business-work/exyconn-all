import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { BookMeetingForm } from '../../../../../../src/pages/book/forms/book-meeting';
import { renderWithProviders } from '../../../../test-utils';
import { press } from '../../../../form-helpers';
import { bookedMeeting } from '../../book-fixtures';

const gql = vi.hoisted(() => ({ book: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useBookMeetingMutation: () => [gql.book],
}));

const at = { org: 'acme', page: 'team' };
const startAt = '2026-10-21T12:00:00.000Z';

function renderForm() {
  const onBooked = vi.fn();
  const onBack = vi.fn();
  renderWithProviders(
    <BookMeetingForm
      at={at}
      slug="intro-call"
      startAt={startAt}
      zone="Asia/Tokyo"
      onBooked={onBooked}
      onBack={onBack}
    />,
  );
  return { onBooked, onBack };
}

/** Sets a field in one change, as a paste or autofill would. */
function fill(label: string, text: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } });
}

function fillDetails() {
  fill('Name', 'Sam Lee');
  fill('Email', 'sam@globex.com');
}

describe('BookMeetingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.book.mockResolvedValue({ data: { bookMeeting: bookedMeeting() } });
  });

  it('wants a name and an email before booking', async () => {
    renderForm();

    await press('Schedule Event');

    expect(await screen.findByText('Enter your name')).toBeInTheDocument();
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
    expect(gql.book).not.toHaveBeenCalled();
  });

  it('books the time in the visitor’s zone and hands back the booking', async () => {
    const { onBooked } = renderForm();
    fillDetails();
    fill('Please share anything that will help prepare for our meeting.', 'Pricing');

    await press('Schedule Event');

    await waitFor(() => expect(onBooked).toHaveBeenCalledWith(bookedMeeting()));
    expect(gql.book).toHaveBeenCalledWith({
      variables: {
        ...at,
        slug: 'intro-call',
        input: {
          name: 'Sam Lee',
          email: 'sam@globex.com',
          guests: [],
          notes: 'Pricing',
          startAt,
          timezone: 'Asia/Tokyo',
        },
      },
    });
  });

  it('hides the guest list until asked, then invites the guests typed', async () => {
    const { onBooked } = renderForm();
    expect(screen.queryByLabelText('Guest emails')).not.toBeInTheDocument();

    await press('Add guests');
    expect(screen.queryByRole('button', { name: 'Add guests' })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Guest emails'), 'ana@globex.com{Enter}');
    fillDetails();
    await press('Schedule Event');

    await waitFor(() => expect(onBooked).toHaveBeenCalledTimes(1));
    expect(gql.book).toHaveBeenCalledWith({
      variables: expect.objectContaining({
        input: expect.objectContaining({ guests: ['ana@globex.com'] }),
      }),
    });
  });

  it('stays on the form when the server answers with no booking', async () => {
    gql.book.mockResolvedValueOnce({ data: undefined });
    const { onBooked } = renderForm();
    fillDetails();

    await press('Schedule Event');

    await waitFor(() => expect(gql.book).toHaveBeenCalledTimes(1));
    expect(onBooked).not.toHaveBeenCalled();
  });

  it('says why the booking failed and logs it', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    gql.book.mockRejectedValueOnce(new Error('That time was just taken'));
    const { onBooked } = renderForm();
    fillDetails();

    await press('Schedule Event');

    expect(await screen.findByText('That time was just taken')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith('crm: booking a meeting failed', expect.any(Error));
    expect(onBooked).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    gql.book.mockRejectedValueOnce('offline');
    renderForm();
    fillDetails();

    await press('Schedule Event');

    expect(await screen.findByText('The meeting could not be booked')).toBeInTheDocument();
  });

  it('goes back to the times from Cancel', async () => {
    const { onBack } = renderForm();

    await press('Cancel');

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
