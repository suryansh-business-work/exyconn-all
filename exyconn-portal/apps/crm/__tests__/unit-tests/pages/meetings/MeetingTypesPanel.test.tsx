import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { appBaseUrl } from '@exyconn/shell/config/apps';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { MeetingTypesPanel } from '../../../../src/pages/meetings/MeetingTypesPanel';
import { renderWithProviders } from '../../test-utils';
import { installClipboard, restoreClipboard } from './clipboard';
import { meetingTypeRow } from './meetings-fixtures';

const gql = vi.hoisted(() => ({
  types: vi.fn(),
  refetch: vi.fn(),
  deleteType: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMeetingTypesQuery: () => gql.types(),
  useDeleteMeetingTypeMutation: () => [gql.deleteType],
  useMeetingBookingPagePathQuery: () => ({ data: undefined }),
}));

vi.mock('../../../../src/pages/meetings/forms/meeting-type', async () => ({
  MeetingTypeForm: (await import('../../form-stub')).FormStub,
}));

const closed = meetingTypeRow({
  id: 'type-2',
  title: 'Demo',
  slug: 'demo',
  bookingPath: '/book/team/demo',
  durationMinutes: 45,
  active: false,
});

function rowOf(title: string) {
  const row = screen.getByRole('cell', { name: title }).closest('tr');
  if (!row) throw new Error(`No row for ${title}`);
  return within(row);
}

describe('MeetingTypesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteType.mockResolvedValue({ data: { deleteMeetingType: true } });
    gql.types.mockReturnValue({
      data: { meetingTypes: [meetingTypeRow(), closed] },
      loading: false,
      refetch: gql.refetch,
    });
  });
  afterEach(restoreClipboard);

  it('lists each type with its length, full link, host and whether it is open', () => {
    renderWithProviders(<MeetingTypesPanel />);

    const intro = rowOf('Intro call');
    expect(intro.getByText('30 min')).toBeInTheDocument();
    expect(intro.getByText(`${appBaseUrl('crm')}/book/team/intro-call`)).toBeInTheDocument();
    expect(intro.getByText('Priya')).toBeInTheDocument();
    expect(intro.getByText('ACTIVE')).toBeInTheDocument();
    expect(rowOf('Demo').getByText('45 min')).toBeInTheDocument();
    expect(rowOf('Demo').getByText('INACTIVE')).toBeInTheDocument();
  });

  it('says there are none yet when the list is empty', () => {
    gql.types.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderWithProviders(<MeetingTypesPanel />);

    expect(screen.getByText('No meeting types yet.')).toBeInTheDocument();
  });

  it('copies a type’s booking link', async () => {
    const writeText = installClipboard();
    renderWithProviders(<MeetingTypesPanel />);

    fireEvent.click(rowOf('Demo').getByRole('button', { name: 'copy booking link' }));

    expect(writeText).toHaveBeenCalledWith(`${appBaseUrl('crm')}/book/team/demo`);
    expect(await screen.findByText('Booking link copied')).toBeInTheDocument();
  });

  it('reports a copy the browser refused', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    installClipboard().mockRejectedValueOnce(new Error('denied'));
    renderWithProviders(<MeetingTypesPanel />);

    fireEvent.click(rowOf('Intro call').getByRole('button', { name: 'copy booking link' }));

    expect(await screen.findByText('Could not copy the link')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith('crm: copying a booking link failed', expect.any(Error));
  });

  it('opens the booking page in a new tab', () => {
    const open = vi.spyOn(globalThis, 'open').mockReturnValue(null);
    renderWithProviders(<MeetingTypesPanel />);

    fireEvent.click(rowOf('Intro call').getByRole('button', { name: 'open booking page' }));

    expect(open).toHaveBeenCalledWith(
      `${appBaseUrl('crm')}/book/team/intro-call`,
      '_blank',
      'noopener',
    );
  });

  it('opens a blank form for a new type and the row’s form for an edit', async () => {
    renderWithProviders(<MeetingTypesPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'New meeting type' }));
    expect(screen.getByRole('heading', { name: 'New meeting type' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await userEvent.click(rowOf('Demo').getByRole('button', { name: 'edit' }));
    expect(screen.getByRole('heading', { name: 'Edit meeting type' })).toBeInTheDocument();
    expect(screen.getByText(/"id":"type-2"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(screen.getByRole('heading', { name: 'Meeting types' })).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a type by id after confirming, naming it', async () => {
    renderWithProviders(<MeetingTypesPanel />);

    await userEvent.click(rowOf('Demo').getByRole('button', { name: 'delete' }));
    expect(
      await screen.findByText('Delete meeting type "Demo"? Its booking link stops working.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(gql.deleteType).toHaveBeenCalledWith({ variables: { id: 'type-2' } });
    expect(await screen.findByText('Meeting type deleted')).toBeInTheDocument();
  });
});
