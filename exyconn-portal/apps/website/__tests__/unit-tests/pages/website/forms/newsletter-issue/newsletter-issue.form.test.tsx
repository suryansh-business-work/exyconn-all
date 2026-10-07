import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  NewsletterIssueForm,
  type NewsletterIssueRow,
} from '../../../../../../src/pages/website/forms/newsletter-issue';
import { renderWithProviders } from '../../../../test-utils';
import { field } from '../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateNewsletterIssueMutation: () => [gql.create],
  useUpdateNewsletterIssueMutation: () => [gql.update],
}));

vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) => {
  const { BoundFieldStub } = await import('../form-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/form/rhf')>()),
    RhfRichText: BoundFieldStub,
    RhfDatePicker: BoundFieldStub,
  };
});

vi.mock('../../../../../../src/pages/cms/media', async () => {
  const { BoundFieldStub } = await import('../form-stubs');
  return { RhfMediaField: BoundFieldStub };
});

const NOW = '2026-05-01T10:00:00.000Z';

const issue: NewsletterIssueRow = {
  id: 'issue-1',
  siteId: 'site-1',
  slug: 'may-2026',
  title: 'May 2026',
  summary: 'What shipped in May',
  coverImage: 'https://cdn.example.com/may.png',
  content: '<p>Hello</p>',
  contentCss: '.hero { color: red; }',
  isActive: false,
  publishedAt: '2026-05-03T00:00:00.000Z',
  updatedAt: '2026-05-03T00:00:00.000Z',
};

function setup(initial: NewsletterIssueRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <NewsletterIssueForm siteId="site-1" initial={initial} onDone={onDone} onCancel={onCancel} />,
  );
  return { user: userEvent.setup(), onDone, onCancel };
}

describe('NewsletterIssueForm', () => {
  beforeEach(() => {
    gql.create.mockReset();
    gql.update.mockReset();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a published issue dated today, with no layout CSS', async () => {
    gql.create.mockResolvedValue({ data: {} });
    const { user, onDone } = setup();

    expect(field('Cover image')).toHaveAttribute('data-site', 'site-1');
    await user.type(field('Title'), 'June 2026');
    await user.type(field('Slug'), 'june-2026');
    await user.type(field('Content'), '<p>News</p>');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          slug: 'june-2026',
          title: 'June 2026',
          summary: '',
          coverImage: '',
          content: '<p>News</p>',
          isActive: true,
          publishedAt: NOW,
          siteId: 'site-1',
          contentCss: '',
        },
      },
    });
    expect(await screen.findByText('Newsletter issue created')).toBeInTheDocument();
  });

  it('updates an issue and keeps the CSS it was laid out with', async () => {
    gql.update.mockResolvedValue({ data: {} });
    const { user, onDone } = setup(issue);

    expect(field('Title')).toHaveValue('May 2026');
    await user.click(screen.getByLabelText('Published on the site'));
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'issue-1',
        input: {
          slug: 'may-2026',
          title: 'May 2026',
          summary: 'What shipped in May',
          coverImage: 'https://cdn.example.com/may.png',
          content: '<p>Hello</p>',
          isActive: true,
          publishedAt: '2026-05-03T00:00:00.000Z',
          siteId: 'site-1',
          contentCss: '.hero { color: red; }',
        },
      },
    });
    expect(await screen.findByText('Newsletter issue updated')).toBeInTheDocument();
  });

  it('requires a slug, a title, content and a publish date', async () => {
    const { user } = setup();

    await user.clear(field('Publish date'));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Slug is required')).toBeInTheDocument();
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Write the issue')).toBeInTheDocument();
    expect(screen.getByText('Pick the publish date')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a slug with spaces and an over-long summary', async () => {
    const { user } = setup(issue);

    await user.clear(field('Slug'));
    await user.type(field('Slug'), 'May Issue');
    await user.click(field('Summary'));
    await user.paste('s'.repeat(501));
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('Use lower-case letters, digits and dashes'),
    ).toBeInTheDocument();
    expect(screen.getByText('Keep the summary under 500 characters')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('Slug already used'));
    const { user, onDone } = setup(issue);

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Slug already used')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
