import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  CaseStudyForm,
  type CaseStudyRow,
} from '../../../../../../src/pages/website/forms/case-study';
import { renderInSite } from '../../../cms/cms-helpers';
import { caseStudyRow } from '../../content-fixtures';
import { fillField, press } from '../content-form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCaseStudyMutation: () => [gql.create],
  useUpdateCaseStudyMutation: () => [gql.update],
}));

/** The rich-text body has its own tests; here it only shows where its images go. */
vi.mock('../../../../../../src/pages/website/live-edit', () => ({
  ArticleBodyField: ({ folder }: Readonly<{ folder: string }>) => (
    <p>{`Body images in ${folder}`}</p>
  ),
}));

function renderForm(initial: CaseStudyRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderInSite(<CaseStudyForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

async function fillRequired() {
  await fillField('Slug', 'acme-migration');
  await fillField('Title', 'Acme migration');
}

describe('CaseStudyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createCaseStudy: { id: 'case-9' } } });
    gql.update.mockResolvedValue({ data: { updateCaseStudy: { id: 'case-1' } } });
  });

  it('requires a slug and a title', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Slug is required')).toBeInTheDocument();
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a bad slug, a cover image that is not a link and a PDF that is not a web URL', async () => {
    renderForm();
    await fillRequired();
    await fillField('Slug', 'acme_migration');
    await fillField('Cover image URL', 'acme.png');
    await fillField('PDF URL', '/files/acme.pdf');

    await press('Create');

    expect(
      await screen.findByText('Lower-case letters, numbers and hyphens only'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter a full URL or a path starting with /')).toBeInTheDocument();
    expect(screen.getByText('Enter a full URL starting with https://')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('files a new case study under the current site, with no publish date', async () => {
    const { onDone } = renderForm();
    expect(screen.getByText('Body images in website/case-studies')).toBeInTheDocument();
    await fillRequired();
    await fillField('Category', 'Cloud');
    await fillField('PDF URL', 'https://cdn.exyconn.com/acme.pdf');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          slug: 'acme-migration',
          title: 'Acme migration',
          excerpt: '',
          content: '',
          contentCss: '',
          coverImage: '',
          category: 'Cloud',
          author: '',
          tags: [],
          pdfUrl: 'https://cdn.exyconn.com/acme.pdf',
          featured: false,
          isActive: true,
          publishedAt: null,
          siteId: 'site-1',
        },
      },
    });
    expect(await screen.findByText('Case study created')).toBeInTheDocument();
  });

  it('updates an existing case study with every field it was opened with', async () => {
    const row = caseStudyRow({ id: 'case-1' });
    const { onDone } = renderForm(row);

    expect(screen.getByLabelText('Author')).toHaveValue('Grace Hopper');
    await fillField('Excerpt', 'A faster Acme');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'case-1',
        input: {
          slug: row.slug,
          title: row.title,
          excerpt: 'A faster Acme',
          content: row.content,
          contentCss: row.contentCss,
          coverImage: row.coverImage,
          category: row.category,
          author: row.author,
          tags: row.tags,
          pdfUrl: row.pdfUrl,
          featured: true,
          isActive: true,
          publishedAt: row.publishedAt,
        },
      },
    });
    expect(await screen.findByText('Case study updated')).toBeInTheDocument();
  });

  it('opens an unpublished case study without a date and saves it as null', async () => {
    const { onDone } = renderForm(caseStudyRow({ id: 'case-2', publishedAt: '' }));

    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input.publishedAt).toBeNull();
  });

  it('reports a failed save and stays open', async () => {
    gql.update.mockRejectedValue(new Error('Case study not found'));
    const { onDone } = renderForm(caseStudyRow());

    await press('Update');

    expect(await screen.findByText('Case study not found')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
