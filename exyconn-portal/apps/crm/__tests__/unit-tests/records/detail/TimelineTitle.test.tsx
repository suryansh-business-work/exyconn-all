import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { appBaseUrl } from '@exyconn/shell/config/apps';
import { CrmTimelineKind } from '@exyconn/shell/graphql/generated';
import { TimelineTitle } from '../../../../src/records/detail/timeline/TimelineTitle';
import { timelineItemHref } from '../../../../src/records/detail/timeline/timelineItemHref';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';

// This bundle is the CRM, as its build sets it.
vi.mock('@exyconn/shell/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/config/env')>();
  return { env: { ...actual.env, portalApp: 'crm' } };
});

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

describe('timelineItemHref', () => {
  it('keeps a CRM page as a path inside this app', () => {
    expect(timelineItemHref({ kind: CrmTimelineKind.Deal, url: '/deals/d-1' })).toBe('/deals/d-1');
  });

  it("points at the portal that owns the entry's page", () => {
    expect(timelineItemHref({ kind: CrmTimelineKind.SupportTicket, url: '/tickets/t-1' })).toBe(
      `${appBaseUrl('support')}/tickets/t-1`,
    );
    expect(timelineItemHref({ kind: CrmTimelineKind.CampaignEmail, url: '/campaigns/c-1' })).toBe(
      `${appBaseUrl('marketing')}/campaigns/c-1`,
    );
  });

  it('has no link for an entry without a page', () => {
    expect(timelineItemHref({ kind: CrmTimelineKind.Note, url: '' })).toBeNull();
  });
});

describe('TimelineTitle', () => {
  it('opens a CRM page with the router, not a full reload', async () => {
    renderWithProviders(
      <>
        <TimelineTitle
          row={{ kind: CrmTimelineKind.Task, url: '/tasks/t-9', title: 'Send the deck' }}
        />
        <Url />
      </>,
    );
    const link = screen.getByRole('link', { name: 'Send the deck' });
    expect(link).toHaveAttribute('href', '/tasks/t-9');

    await userEvent.click(link);
    expect(screen.getByRole('status', { name: 'url' })).toHaveTextContent('/tasks/t-9');
  });

  it("links an entry on another portal to that portal's address", () => {
    renderWithProviders(
      <TimelineTitle
        row={{ kind: CrmTimelineKind.SupportTicket, url: '/tickets/t-1', title: 'Ticket #4' }}
        strong
      />,
    );
    expect(screen.getByRole('link', { name: 'Ticket #4' })).toHaveAttribute(
      'href',
      `${appBaseUrl('support')}/tickets/t-1`,
    );
  });

  it('writes the title as text when there is no page: bold on the rail, plain in the table', () => {
    const row = { kind: CrmTimelineKind.Note, url: '', title: 'Left a note' };
    const { container, rerender } = renderWithProviders(<TimelineTitle row={row} strong />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('p, span')).toHaveTextContent('Left a note');

    rerender(<TimelineTitle row={row} />);
    expect(container).toHaveTextContent('Left a note');
    expect(container.querySelector('p, span')).toBeNull();
  });
});
