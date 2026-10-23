import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { appBaseUrl } from '@exyconn/shell/config/apps';
import {
  CrmTimelineFieldType,
  CrmTimelineKind,
  CrmTimelineObject,
} from '@exyconn/shell/graphql/generated';
import { Timeline } from '../../../../src/records/detail';
import type { TimelineRow } from '../../../../src/records/detail/timeline/TimelineEntry';
import { timelinePageHref } from '../../../../src/records/detail/timeline/timelineItemHref';
import { renderWithProviders } from '../../test-utils';

// This bundle is the CRM, as its build sets it.
vi.mock('@exyconn/shell/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/config/env')>();
  return { env: { ...actual.env, portalApp: 'crm' } };
});

const gql = vi.hoisted(() => ({ timeline: vi.fn(), detail: vi.fn(), refetch: vi.fn() }));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmTimelineQuery: (options: unknown) => gql.timeline(options),
  useCrmTimelineDetailQuery: (options: unknown) => gql.detail(options),
}));

function row(overrides: Partial<TimelineRow>): TimelineRow {
  return {
    __typename: 'CrmTimelineItem',
    id: 'gmail:m-1',
    kind: CrmTimelineKind.Email,
    at: '2026-10-15T10:00:00.000Z',
    title: 'Emailed: Introduction to Exyconn',
    summary: "Glad you're in",
    actor: 'Ravi',
    status: 'Sent',
    url: '/contacts/c-1/emails',
    opensPage: false,
    attachments: [],
    ...overrides,
  };
}

const EMAIL = row({});
const TICKET = row({
  id: 'ticket:t-1',
  kind: CrmTimelineKind.SupportTicket,
  title: 'Support ticket EXY-49ZAXC: Website chat',
  url: '/support/tickets/t-1',
  opensPage: true,
});
const DRAFT = row({
  id: 'activity:a-1',
  kind: CrmTimelineKind.Note,
  title: 'Cold email drafted',
  url: '/contacts/c-1/cold-emails?coldEmail=d-1',
  opensPage: true,
});

const field = (label: string, value: string, type = CrmTimelineFieldType.Text) => ({
  __typename: 'CrmTimelineField' as const,
  label,
  value,
  type,
});

function detailAnswer(body = 'Hi Asha,\nYou are in.') {
  return {
    data: {
      crmTimelineDetail: {
        fields: [
          field('From', 'sales@exyconn.com'),
          field('Date', '2026-10-15T10:00:00.000Z', CrmTimelineFieldType.Date),
          field('Value', '5000', CrmTimelineFieldType.Money),
        ],
        body,
      },
    },
    loading: false,
    error: undefined,
    refetch: gql.refetch,
  };
}

function renderTimeline(rows: TimelineRow[], route = '/') {
  gql.timeline.mockReturnValue({
    data: { crmTimeline: rows },
    loading: false,
    error: undefined,
    refetch: gql.refetch,
  });
  return renderWithProviders(<Timeline object={CrmTimelineObject.Contact} id="c-1" />, { route });
}

const viewDetails = (title: string) =>
  screen.getByRole('button', { name: `View details of ${title}` });

describe('View details on the timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.detail.mockReturnValue(detailAnswer());
  });

  it("opens a CRM email in a dialog with its fields and full text, read for this record's entry", async () => {
    renderTimeline([EMAIL]);
    await userEvent.click(viewDetails(EMAIL.title));

    const dialog = screen.getByRole('dialog', { name: EMAIL.title });
    expect(gql.detail).toHaveBeenCalledWith({
      variables: { object: CrmTimelineObject.Contact, id: 'c-1', itemId: 'gmail:m-1' },
    });
    expect(within(dialog).getByText('sales@exyconn.com')).toBeInTheDocument();
    expect(within(dialog).getByText('Ravi')).toBeInTheDocument();
    expect(within(dialog).getByText(/5,000/)).toBeInTheDocument();
    expect(dialog.querySelector('time[datetime="2026-10-15T10:00:00.000Z"]')).not.toBeNull();
    expect(within(dialog).getByText(/You are in\./)).toBeInTheDocument();
    // The Emails tab the entry belongs to is linked from the dialog.
    expect(within(dialog).getByRole('link', { name: EMAIL.title })).toHaveAttribute(
      'href',
      '/contacts/c-1/emails',
    );

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('goes to the support portal for a ticket instead of opening a dialog', () => {
    renderTimeline([TICKET]);
    expect(screen.getByRole('link', { name: `View details of ${TICKET.title}` })).toHaveAttribute(
      'href',
      `${appBaseUrl('support')}/support/tickets/t-1`,
    );
  });

  it("opens a drafted cold email on its record's tab inside the CRM", () => {
    renderTimeline([DRAFT]);
    expect(screen.getByRole('link', { name: `View details of ${DRAFT.title}` })).toHaveAttribute(
      'href',
      '/contacts/c-1/cold-emails?coldEmail=d-1',
    );
  });

  it('shows the entry it already has with a skeleton while the record loads', async () => {
    gql.detail.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    renderTimeline([
      row({
        id: 'activity:n-1',
        kind: CrmTimelineKind.Note,
        url: '',
        attachments: [
          {
            __typename: 'FileAttachment',
            url: 'https://cdn/a.pdf',
            name: 'a.pdf',
            contentType: 'application/pdf',
          },
        ],
      }),
    ]);
    await userEvent.click(viewDetails(EMAIL.title));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('status')).toHaveTextContent('Loading the details');
    expect(within(dialog).getByText('Note')).toBeInTheDocument();
    // Only the file it carries is linked: a note has no page of its own.
    expect(
      within(dialog)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['a.pdf']);
  });

  it('reports a failed read with Retry', async () => {
    gql.refetch.mockRejectedValue(new Error('still down'));
    gql.detail.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Timeline entry not found'),
      refetch: gql.refetch,
    });
    renderTimeline([EMAIL]);
    await userEvent.click(viewDetails(EMAIL.title));

    const alert = within(screen.getByRole('dialog')).getByRole('alert');
    expect(alert).toHaveTextContent('Timeline entry not found');
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(gql.refetch).toHaveBeenCalled();
  });

  it('leaves out an empty field list and body', async () => {
    gql.detail.mockReturnValue({
      data: { crmTimelineDetail: { fields: [], body: '' } },
      loading: false,
      refetch: gql.refetch,
    });
    renderTimeline([EMAIL]);
    await userEvent.click(viewDetails(EMAIL.title));
    expect(within(screen.getByRole('dialog')).queryByText(/You are in/)).not.toBeInTheDocument();
  });

  it('offers View details in the table too', async () => {
    renderTimeline([EMAIL, TICKET], '/?view=table');
    const table = screen.getByRole('table');
    expect(
      within(table).getByRole('link', { name: `View details of ${TICKET.title}` }),
    ).toBeInTheDocument();
    await userEvent.click(
      within(table).getByRole('button', { name: `View details of ${EMAIL.title}` }),
    );
    expect(screen.getByRole('dialog', { name: EMAIL.title })).toBeInTheDocument();
  });
});

describe('timelinePageHref', () => {
  it("is the entry's own page only when it has one", () => {
    expect(timelinePageHref(TICKET)).toBe(`${appBaseUrl('support')}/support/tickets/t-1`);
    expect(timelinePageHref(EMAIL)).toBeNull();
  });
});
