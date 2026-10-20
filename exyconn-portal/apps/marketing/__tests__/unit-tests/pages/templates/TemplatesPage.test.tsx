import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_FORMAT_SETTINGS, formatDateTime } from '@exyconn/i18n';
import { TemplatesPage } from '../../../../src/pages/templates';
import { renderWithProviders } from '../../test-utils';
import { templateRow } from '../marketing/forms/campaign-template/template.fixtures';

const gql = vi.hoisted(() => ({
  list: vi.fn(),
  refetch: vi.fn(),
  duplicate: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCampaignTemplatesQuery: (options: unknown) => gql.list(options),
  useDuplicateCampaignTemplateMutation: () => [gql.duplicate],
  useDeleteCampaignTemplateMutation: () => [gql.remove],
}));

/** The preview and history panels have their own tests; these show what they were opened on. */
vi.mock('../../../../src/pages/templates/TemplatePreview', () => ({
  TemplatePreview: ({ template }: Readonly<{ template: { name: string } }>) => (
    <p>{`Preview of ${template.name}`}</p>
  ),
}));
vi.mock('../../../../src/pages/templates/TemplateVersions', () => ({
  TemplateVersions: ({
    template,
    onRestored,
  }: Readonly<{ template: { name: string }; onRestored: () => void }>) => (
    <button type="button" onClick={onRestored}>
      {`Restore a version of ${template.name}`}
    </button>
  ),
}));

const WELCOME = templateRow();
const PROMO = templateRow({
  id: 'tpl-2',
  name: 'Promo',
  category: 'Promotion',
  version: 4,
  updatedByName: '',
});

const list = (rows = [WELCOME, PROMO], loading = false) =>
  gql.list.mockReturnValue({
    data: { listCampaignTemplates: rows },
    loading,
    refetch: gql.refetch,
  });

const action = (name: string) => screen.getByRole('button', { name });

describe('TemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.duplicate.mockResolvedValue({ data: { duplicateCampaignTemplate: WELCOME } });
    gql.remove.mockResolvedValue({ data: { deleteCampaignTemplate: true } });
    list();
  });

  it('lists every template with its category, version and last editor', () => {
    renderWithProviders(<TemplatesPage />);
    const when = formatDateTime(WELCOME.updatedAt, DEFAULT_FORMAT_SETTINGS);
    const [, welcome, promo] = screen.getAllByRole('row');

    expect(gql.list).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('heading', { level: 1, name: 'Email templates' })).toBeVisible();
    expect(within(welcome).getByText('Welcome')).toBeInTheDocument();
    expect(within(welcome).getByText(`${when} · Asha Rao`)).toBeInTheDocument();
    expect(within(promo).getByText('Promotion')).toBeInTheDocument();
    expect(within(promo).getByText('4')).toBeInTheDocument();
    expect(within(promo).getByText(`${when} · —`)).toBeInTheDocument();
  });

  it('says how to make a template when there is none', () => {
    list([]);
    renderWithProviders(<TemplatesPage />);

    expect(
      screen.getByText('No templates yet. Use “Save as template” in the Email Studio.'),
    ).toBeInTheDocument();
  });

  it('reloads the list from the table', async () => {
    renderWithProviders(<TemplatesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('previews a template in a side panel, and closes it', async () => {
    renderWithProviders(<TemplatesPage />);

    await userEvent.click(action('Preview Promo'));
    const panel = await screen.findByRole('presentation');
    expect(within(panel).getByRole('heading', { name: 'Template preview' })).toBeVisible();
    expect(within(panel).getByText('Preview of Promo')).toBeVisible();

    await userEvent.click(within(panel).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Preview of Promo')).not.toBeInTheDocument());
  });

  it('shows the version history and reloads the list after a restore', async () => {
    renderWithProviders(<TemplatesPage />);

    await userEvent.click(action('Version history of Welcome'));
    const panel = await screen.findByRole('presentation');
    expect(within(panel).getByRole('heading', { name: 'Version history' })).toBeVisible();
    expect(screen.queryByText('Preview of Welcome')).not.toBeInTheDocument();

    await userEvent.click(
      within(panel).getByRole('button', { name: 'Restore a version of Welcome' }),
    );
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('duplicates a template and reloads the list', async () => {
    renderWithProviders(<TemplatesPage />);

    await userEvent.click(action('Duplicate Welcome'));

    expect(await screen.findByText('Template duplicated')).toBeInTheDocument();
    expect(gql.duplicate).toHaveBeenCalledWith({ variables: { id: 'tpl-1' } });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('reports a failed duplicate without reloading', async () => {
    gql.duplicate.mockRejectedValue('boom');
    renderWithProviders(<TemplatesPage />);

    await userEvent.click(action('Duplicate Welcome'));

    expect(await screen.findByText('The template could not be duplicated')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('deletes a template only after confirming', async () => {
    renderWithProviders(<TemplatesPage />);

    await userEvent.click(action('Delete Promo'));
    expect(
      await screen.findByText(
        'Delete “Promo” and its history? Campaigns made from it keep their own copy.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Template deleted')).toBeInTheDocument();
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'tpl-2' } });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the template when the delete is declined', async () => {
    renderWithProviders(<TemplatesPage />);

    await userEvent.click(action('Delete Promo'));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('Delete template?')).not.toBeInTheDocument());
    expect(gql.remove).not.toHaveBeenCalled();
  });

  it('reports why a delete failed', async () => {
    gql.remove.mockRejectedValue(new Error('Template is in use'));
    renderWithProviders(<TemplatesPage />);

    await userEvent.click(action('Delete Promo'));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Template is in use')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('shows a busy table, not the empty message, while the first load runs', () => {
    gql.list.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    const { container } = renderWithProviders(<TemplatesPage />);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText(/^No templates yet/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Preview Welcome' })).not.toBeInTheDocument();
  });
});
