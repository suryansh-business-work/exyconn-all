import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewsletterIssuesDocument } from '@exyconn/shell/graphql/generated';
import { NewsletterIssuesPage } from '../../../../../src/pages/cms/newsletter';
import type { NewsletterIssueRow } from '../../../../../src/pages/website/forms/newsletter-issue';
import { crudDashboard, crudProps } from '../cms-dashboard-stub';
import { confirmRowDelete, runRowAction } from '../cms-crud-helpers';
import { actionSpecs, cellStatus, cellText, columnIds } from '../cms-grid-helpers';
import { formatDate, renderInSite } from '../cms-helpers';

const spies = vi.hoisted(() => ({ query: vi.fn(), deleteIssue: vi.fn() }));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => ({ query: spies.query }),
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDeleteNewsletterIssueMutation: () => [spies.deleteIssue],
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../cms-settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/crud', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/crud')>()),
  CrudDashboard: (await import('../cms-dashboard-stub')).CrudDashboardStub,
}));
vi.mock('../../../../../src/pages/website/forms/newsletter-issue', async () => ({
  NewsletterIssueForm: (await import('../cms-form-stub')).CmsFormStub,
}));

const issue = (overrides: Partial<NewsletterIssueRow> = {}): NewsletterIssueRow => ({
  id: 'issue-1',
  siteId: 'site-1',
  slug: 'launch',
  title: 'Launch',
  summary: '',
  coverImage: '',
  content: '',
  contentCss: '',
  isActive: true,
  publishedAt: '2026-05-01',
  updatedAt: '2026-05-01',
  ...overrides,
});

describe('NewsletterIssuesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crudDashboard.props = null;
    spies.deleteIssue.mockResolvedValue({ data: {} });
  });

  it("lists the site's issues by title, slug, status and publish date", () => {
    renderInSite(<NewsletterIssuesPage />);
    const columns = crudProps().columnDefs;

    expect(crudProps()).toMatchObject({
      title: 'Newsletter issues',
      subtitleValues: { site: 'Exyconn' },
      entityLabel: 'issue',
      exportFileName: 'newsletter-issues',
    });
    expect(crudProps().context.formatDate).toBe(formatDate);
    expect(columnIds(columns)).toEqual(['title', 'slug', 'isActive', 'publishedAt', 'actions']);
    expect(cellText(columns, 'title', issue())).toBe('Launch');
    expect(cellText(columns, 'slug', issue())).toBe('launch');
    expect(cellStatus(columns, 'isActive', issue())).toBe('ACTIVE');
    expect(cellStatus(columns, 'isActive', issue({ isActive: false }))).toBe('INACTIVE');
    expect(cellText(columns, 'publishedAt', issue(), '2026-05-01')).toBe('on 2026-05-01');
    expect(actionSpecs(columns).map((spec) => spec.key)).toEqual(['edit', 'delete']);
  });

  it('reads one page of issues for the site', async () => {
    const page = { rows: [issue()], totalCount: 1 };
    spies.query.mockResolvedValue({ data: { newsletterIssues: page } });
    renderInSite(<NewsletterIssuesPage />);

    const fetchRows = crudProps().fetchRows as (input: object) => Promise<unknown>;
    await expect(fetchRows({ page: 0, pageSize: 20 })).resolves.toEqual(page);
    expect(spies.query).toHaveBeenCalledWith(
      expect.objectContaining({ query: NewsletterIssuesDocument }),
    );
  });

  it('opens a blank form for a new issue and the row for an edit', async () => {
    renderInSite(<NewsletterIssuesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form on site-1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', issue());
    expect(screen.getByText('Form for issue-1 on site-1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Form for/)).not.toBeInTheDocument();
  });

  it('deletes an issue after confirming', async () => {
    renderInSite(<NewsletterIssuesPage />);

    await confirmRowDelete(issue({ id: 'issue-7' }), 'Delete the issue Launch?');

    expect(spies.deleteIssue).toHaveBeenCalledWith({ variables: { id: 'issue-7' } });
    expect(await screen.findByText('Newsletter issue deleted')).toBeInTheDocument();
  });
});
