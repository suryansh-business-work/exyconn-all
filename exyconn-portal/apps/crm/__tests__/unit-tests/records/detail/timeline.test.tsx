import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { appUrl } from '@exyconn/shell/config/apps';
import { CrmTimelineKind, CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import { Timeline } from '../../../../src/records/detail';
import { AttachmentPreview } from '../../../../src/records/detail/timeline/AttachmentPreview';
import type { TimelineRow } from '../../../../src/records/detail/timeline/TimelineEntry';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ timeline: vi.fn(), refetch: vi.fn() }));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmTimelineQuery: (options: unknown) => gql.timeline(options),
}));

function row(overrides: Partial<TimelineRow>): TimelineRow {
  return {
    __typename: 'CrmTimelineItem',
    id: 'row-1',
    kind: CrmTimelineKind.Note,
    at: '2026-10-15T10:00:00.000Z',
    title: 'Called about pricing',
    summary: '',
    actor: '',
    status: '',
    url: '',
    attachments: [],
    ...overrides,
  };
}

// The server sends each entry's page as a path; an email opens on the record's Emails tab.
const EMAIL_PATH = '/contacts/contact-1/emails';
const EMAIL_HREF = appUrl('crm', EMAIL_PATH);

const ROWS = [
  row({ id: 'n', title: 'Left a note', actor: 'Priya', summary: 'Wants a demo', status: 'Done' }),
  row({ id: 'e', kind: CrmTimelineKind.Email, title: 'Re: Pricing', url: EMAIL_PATH }),
  row({ id: 's', kind: CrmTimelineKind.SupportTicket, title: 'Ticket #4' }),
];

function answered(rows: TimelineRow[]) {
  return { data: { crmTimeline: rows }, loading: false, error: undefined, refetch: gql.refetch };
}

describe('Timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
  });

  it('lists every touchpoint newest first with its details', () => {
    gql.timeline.mockReturnValue(answered(ROWS));
    renderWithProviders(<Timeline object={CrmTimelineObject.Contact} id="contact-1" limit={5} />);
    expect(gql.timeline).toHaveBeenCalledWith({
      variables: { object: CrmTimelineObject.Contact, id: 'contact-1', limit: 5 },
      fetchPolicy: 'cache-and-network',
    });
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText('Wants a demo')).toBeInTheDocument();
    expect(within(items[0]).getByText('Done')).toBeInTheDocument();
    expect(items[0]).toHaveTextContent('by Priya');
    expect(within(items[1]).getByRole('link', { name: 'Re: Pricing' })).toHaveAttribute(
      'href',
      EMAIL_HREF,
    );
    expect(items[2]).not.toHaveTextContent('by');
  });

  it('filters by kind of touchpoint', async () => {
    gql.timeline.mockReturnValue(answered(ROWS));
    renderWithProviders(<Timeline object={CrmTimelineObject.Company} id="company-1" />);
    const group = screen.getByRole('group', { name: 'Show' });
    expect(within(group).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(within(group).getByRole('button', { name: 'Emails' }));
    expect(within(group).getByRole('button', { name: 'Emails' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('Re: Pricing'),
    ]);
    await userEvent.click(within(group).getByRole('button', { name: 'Leads & deals' }));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByText('Nothing has happened with this record yet.')).toBeInTheDocument();
  });

  it('hides the filters on the overview', () => {
    gql.timeline.mockReturnValue(answered([]));
    renderWithProviders(<Timeline object={CrmTimelineObject.Contact} id="c" filters={false} />);
    expect(screen.queryByRole('group', { name: 'Show' })).not.toBeInTheDocument();
    expect(screen.getByText('Nothing has happened with this record yet.')).toBeInTheDocument();
  });

  it('shows a skeleton while loading', () => {
    gql.timeline.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: gql.refetch,
    });
    renderWithProviders(<Timeline object={CrmTimelineObject.Contact} id="c" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading the activity');
  });

  it('shows the failure with Retry', async () => {
    gql.timeline.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Down'),
      refetch: gql.refetch,
    });
    renderWithProviders(<Timeline object={CrmTimelineObject.Contact} id="c" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Down');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(gql.refetch).toHaveBeenCalled();
  });

  it('swallows a failed retry, leaving the error on screen', async () => {
    gql.refetch.mockRejectedValue(new Error('still down'));
    gql.timeline.mockReturnValue({
      data: undefined,
      loading: false,
      error: {},
      refetch: gql.refetch,
    });
    renderWithProviders(<Timeline object={CrmTimelineObject.Contact} id="c" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the activity.');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('keeps showing rows when a refresh fails', () => {
    gql.timeline.mockReturnValue({ ...answered(ROWS), error: new Error('x') });
    renderWithProviders(<Timeline object={CrmTimelineObject.Contact} id="c" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('switches between the timeline and a table', async () => {
    gql.timeline.mockReturnValue(answered(ROWS));
    renderWithProviders(<Timeline object={CrmTimelineObject.Contact} id="c" />);
    const views = screen.getByRole('group', { name: 'Activity view' });
    await userEvent.click(within(views).getByRole('button', { name: 'Timeline' }));
    expect(within(views).getByRole('button', { name: 'Timeline' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(within(views).getByRole('button', { name: 'Table' }));
    expect(within(views).getByRole('button', { name: 'Table' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const table = screen.getByRole('table');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Type', 'Activity', 'Status', 'Details', 'When', 'By']);
    expect(within(table).getByRole('link', { name: 'Re: Pricing' })).toHaveAttribute(
      'href',
      EMAIL_HREF,
    );
    expect(within(table).getByText('Wants a demo')).toBeInTheDocument();
    expect(within(table).getByText('Priya')).toBeInTheDocument();
    await userEvent.click(within(views).getByRole('button', { name: 'Timeline' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('opens the table from the URL and refreshes it', async () => {
    gql.timeline.mockReturnValue(answered(ROWS));
    renderWithProviders(<Timeline object={CrmTimelineObject.Contact} id="c" />, {
      route: '/?view=table',
    });
    expect(screen.getAllByRole('row')).toHaveLength(4);
    await userEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(gql.refetch).toHaveBeenCalled();
  });

  it('keeps the overview on the timeline whatever the URL says', () => {
    gql.timeline.mockReturnValue(answered(ROWS));
    renderWithProviders(<Timeline object={CrmTimelineObject.Contact} id="c" filters={false} />, {
      route: '/?view=table',
    });
    expect(screen.queryByRole('group', { name: 'Activity view' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows the files an entry carries', () => {
    gql.timeline.mockReturnValue(
      answered([
        row({
          attachments: [
            {
              __typename: 'FileAttachment',
              url: 'https://cdn/a.pdf',
              name: 'a.pdf',
              contentType: 'application/pdf',
            },
          ],
        }),
      ]),
    );
    renderWithProviders(<Timeline object={CrmTimelineObject.Contact} id="c" />);
    expect(screen.getByRole('link', { name: 'a.pdf' })).toHaveAttribute(
      'href',
      'https://cdn/a.pdf',
    );
  });
});

describe('AttachmentPreview', () => {
  it('plays audio and video, shows photos and links other files', () => {
    const { container, rerender } = renderWithProviders(
      <AttachmentPreview
        attachment={{ url: 'https://cdn/v.webm', name: 'Voice note', contentType: 'audio/webm' }}
      />,
    );
    expect(container.querySelector('audio')).toHaveAttribute('aria-label', 'Voice note');
    rerender(
      <AttachmentPreview
        attachment={{ url: 'https://cdn/c.mp4', name: 'Clip', contentType: 'video/mp4' }}
      />,
    );
    expect(container.querySelector('video')).toHaveAttribute('src', 'https://cdn/c.mp4');
    rerender(
      <AttachmentPreview
        attachment={{ url: 'https://cdn/p.png', name: 'Photo', contentType: 'image/png' }}
      />,
    );
    expect(screen.getByRole('img', { name: 'Photo' })).toHaveAttribute('src', 'https://cdn/p.png');
    rerender(
      <AttachmentPreview
        attachment={{ url: 'https://cdn/d.pdf', name: 'Deck.pdf', contentType: 'application/pdf' }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Deck.pdf' })).toHaveAttribute('target', '_blank');
  });
});
