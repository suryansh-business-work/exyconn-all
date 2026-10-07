import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  NewsletterSubscriberStatus,
  NewsletterSubscribersDocument,
} from '@exyconn/shell/graphql/generated';
import { NewsletterSubscribersPage } from '../../../../../src/pages/cms/newsletter';
import type { NewsletterSubscriberRow } from '../../../../../src/pages/website/forms/newsletter-subscriber';
import { crudDashboard, crudProps } from '../cms-dashboard-stub';
import { confirmRowDelete, runRowAction } from '../cms-crud-helpers';
import { cellStatus, cellText, columnIds, isActionHidden } from '../cms-grid-helpers';
import { renderInSite } from '../cms-helpers';

const spies = vi.hoisted(() => ({ query: vi.fn(), deleteSubscriber: vi.fn(), setStatus: vi.fn() }));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => ({ query: spies.query }),
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDeleteNewsletterSubscriberMutation: () => [spies.deleteSubscriber],
  useSetNewsletterSubscriberStatusMutation: () => [spies.setStatus],
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../cms-settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/crud', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/crud')>()),
  CrudDashboard: (await import('../cms-dashboard-stub')).CrudDashboardStub,
}));
vi.mock('../../../../../src/pages/website/forms/newsletter-subscriber', async () => ({
  NewsletterSubscriberForm: (await import('../cms-form-stub')).CmsFormStub,
}));

const subscriber = (overrides: Partial<NewsletterSubscriberRow> = {}): NewsletterSubscriberRow => ({
  id: 'subscriber-1',
  siteId: 'site-1',
  email: 'asha@example.com',
  name: 'Asha',
  status: NewsletterSubscriberStatus.Subscribed,
  source: 'footer',
  consentAt: '2026-04-01',
  createdAt: '2026-04-01',
  ...overrides,
});
const gone = subscriber({ name: '', source: '', status: NewsletterSubscriberStatus.Unsubscribed });

describe('NewsletterSubscribersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crudDashboard.props = null;
    spies.deleteSubscriber.mockResolvedValue({ data: {} });
    spies.setStatus.mockResolvedValue({ data: {} });
  });

  it('lists who signed up, with a dash for what they left out', () => {
    renderInSite(<NewsletterSubscribersPage />);
    const columns = crudProps().columnDefs;

    expect(crudProps()).toMatchObject({
      title: 'Newsletter subscribers',
      entityLabel: 'subscriber',
      exportFileName: 'newsletter-subscribers',
    });
    expect(columnIds(columns)).toEqual([
      'email',
      'name',
      'status',
      'source',
      'consentAt',
      'actions',
    ]);
    expect(cellText(columns, 'email', subscriber())).toBe('asha@example.com');
    expect(cellText(columns, 'name', subscriber())).toBe('Asha');
    expect(cellText(columns, 'name', gone)).toBe('—');
    expect(cellText(columns, 'source', subscriber())).toBe('footer');
    expect(cellText(columns, 'source', gone)).toBe('—');
    expect(cellStatus(columns, 'status', gone)).toBe('UNSUBSCRIBED');
  });

  it('offers unsubscribe to subscribers and subscribe-again to the others', () => {
    renderInSite(<NewsletterSubscribersPage />);
    const columns = crudProps().columnDefs;

    expect(isActionHidden(columns, 'unsubscribe', subscriber())).toBe(false);
    expect(isActionHidden(columns, 'resubscribe', subscriber())).toBe(true);
    expect(isActionHidden(columns, 'unsubscribe', gone)).toBe(true);
    expect(isActionHidden(columns, 'resubscribe', gone)).toBe(false);
  });

  it('reads one page of subscribers for the site', async () => {
    const page = { rows: [subscriber()], totalCount: 1 };
    spies.query.mockResolvedValue({ data: { newsletterSubscribers: page } });
    renderInSite(<NewsletterSubscribersPage />);

    const fetchRows = crudProps().fetchRows as (input: object) => Promise<unknown>;
    await expect(fetchRows({ page: 0, pageSize: 20 })).resolves.toEqual(page);
    expect(spies.query).toHaveBeenCalledWith(
      expect.objectContaining({ query: NewsletterSubscribersDocument }),
    );
  });

  it('unsubscribes after asking, and subscribes again straight away', async () => {
    renderInSite(<NewsletterSubscribersPage />);

    await runRowAction('unsubscribe', subscriber());
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Unsubscribe' }));
    await waitFor(() =>
      expect(spies.setStatus).toHaveBeenCalledWith({
        variables: { id: 'subscriber-1', status: NewsletterSubscriberStatus.Unsubscribed },
      }),
    );

    await runRowAction('resubscribe', gone);
    await waitFor(() => expect(spies.setStatus).toHaveBeenCalledTimes(2));
    expect(spies.setStatus).toHaveBeenLastCalledWith({
      variables: { id: 'subscriber-1', status: NewsletterSubscriberStatus.Subscribed },
    });
  });

  it('adds a subscriber by hand from a blank form', async () => {
    renderInSite(<NewsletterSubscribersPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form on site-1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText('Blank form on site-1')).not.toBeInTheDocument();
  });

  it('deletes a subscriber and their consent after confirming', async () => {
    renderInSite(<NewsletterSubscribersPage />);

    await confirmRowDelete(
      subscriber(),
      'Delete asha@example.com from the list? Their consent record goes with it.',
    );

    expect(spies.deleteSubscriber).toHaveBeenCalledWith({ variables: { id: 'subscriber-1' } });
    expect(await screen.findByText('Subscriber deleted')).toBeInTheDocument();
  });
});
