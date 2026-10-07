import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocPageEditor } from '../../../../../src/pages/projects/docs/DocPageEditor';
import { renderWithProviders } from '../../../test-utils';
import { docPage, docPageWithBody } from '../../../fixtures';

const gql = vi.hoisted(() => ({ page: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDocPageQuery: (options: unknown) => gql.page(options),
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `[${value}]` }),
}));

/** The page form has its own tests; here it submits fixed values and can be cancelled. */
vi.mock('../../../../../src/pages/projects/forms/doc-page', () => ({
  DocPageForm: ({
    page,
    onSubmit,
    onCancel,
  }: Readonly<{
    page: { title: string };
    onSubmit: (values: { title: string; body: string }) => void;
    onCancel: () => void;
  }>) => (
    <div>
      <p>{`Editing ${page.title}`}</p>
      <button type="button" onClick={() => onSubmit({ title: 'New title', body: '<p>New</p>' })}>
        Submit page
      </button>
      <button type="button" onClick={onCancel}>
        Leave page
      </button>
    </div>
  ),
}));

const handlers = { onSave: vi.fn(), onDelete: vi.fn(), onCancel: vi.fn() };
const TRAIL = [docPage('runbooks', null, 'Runbooks'), docPage('page-1', 'runbooks', 'Runbook')];

const renderEditor = () =>
  renderWithProviders(<DocPageEditor pageId="page-1" trail={TRAIL} {...handlers} />);

describe('DocPageEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handlers.onSave.mockResolvedValue(undefined);
    gql.page.mockReturnValue({ data: { docPage: docPageWithBody() }, loading: false });
  });

  it('loads the open page fresh, and shows a spinner until it first arrives', () => {
    gql.page.mockReturnValue({ data: undefined, loading: true });
    renderEditor();

    expect(gql.page).toHaveBeenCalledWith({
      variables: { id: 'page-1' },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
  });

  it('keeps showing a cached page while it refreshes', () => {
    gql.page.mockReturnValue({ data: { docPage: docPageWithBody() }, loading: true });
    renderEditor();

    expect(screen.getByText('Editing Runbook')).toBeInTheDocument();
  });

  it('says so when the page no longer exists', () => {
    gql.page.mockReturnValue({ data: undefined, loading: false });
    renderEditor();

    expect(screen.getByText('This page has been deleted.')).toBeInTheDocument();
  });

  it('shows where the page sits and who saved it last, and when', () => {
    renderEditor();

    expect(screen.getByText('Runbooks / Runbook')).toBeInTheDocument();
    expect(
      screen.getByText('Last saved by Asha Rao · [2026-09-04T10:00:00.000Z]'),
    ).toBeInTheDocument();
  });

  it('says nobody has saved a page yet when it has no editor', () => {
    gql.page.mockReturnValue({
      data: { docPage: docPageWithBody({ updatedByName: '' }) },
      loading: false,
    });
    renderEditor();

    expect(screen.getByText(/^Last saved by nobody yet/)).toBeInTheDocument();
  });

  it('saves the page by its id and hands Cancel back', async () => {
    renderEditor();

    await userEvent.click(screen.getByRole('button', { name: 'Submit page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Leave page' }));

    expect(handlers.onSave).toHaveBeenCalledWith('page-1', {
      title: 'New title',
      body: '<p>New</p>',
    });
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  });

  it('deletes the page and everything under it only once that is confirmed', async () => {
    renderEditor();

    await userEvent.click(screen.getByRole('button', { name: 'Delete page' }));
    expect(
      await screen.findByText('Delete "Runbook" and every page under it?'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(handlers.onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete page' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(handlers.onDelete).toHaveBeenCalledWith('page-1');
  });
});
