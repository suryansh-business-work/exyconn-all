import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_FORMAT_SETTINGS, formatDateTime } from '@exyconn/i18n';
import { TemplateVersions } from '../../../../src/pages/templates/TemplateVersions';
import { renderWithProviders } from '../../test-utils';
import { pending } from '../../fixtures';
import { templateRow } from '../marketing/forms/campaign-template/template.fixtures';

const gql = vi.hoisted(() => ({
  versions: vi.fn(),
  refetch: vi.fn(),
  restore: vi.fn(),
  restoring: false,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCampaignTemplateVersionsQuery: (options: unknown) => gql.versions(options),
  useRestoreCampaignTemplateVersionMutation: () => [gql.restore, { loading: gql.restoring }],
}));

const CREATED_AT = '2026-09-02T09:30:00.000Z';
const WHEN = formatDateTime(CREATED_AT, DEFAULT_FORMAT_SETTINGS);
const TEMPLATE = templateRow({ id: 'tpl-3', version: 3 });
const VERSIONS = [
  { id: 'v3', version: 3, note: 'New hero', createdByName: 'Asha Rao', createdAt: CREATED_AT },
  { id: 'v2', version: 2, note: '', createdByName: '', createdAt: CREATED_AT },
];

function renderVersions() {
  const onRestored = vi.fn();
  renderWithProviders(<TemplateVersions template={TEMPLATE} onRestored={onRestored} />);
  return { onRestored };
}

describe('TemplateVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.restoring = false;
    gql.refetch.mockResolvedValue({});
    gql.restore.mockResolvedValue({ data: { restoreCampaignTemplateVersion: TEMPLATE } });
    gql.versions.mockReturnValue({
      data: { campaignTemplateVersions: VERSIONS },
      loading: false,
      error: undefined,
      refetch: gql.refetch,
    });
  });

  it('lists every version fresh, marking the current one, which cannot be restored', () => {
    renderVersions();
    const [current, older] = screen.getAllByRole('listitem');

    expect(gql.versions).toHaveBeenCalledWith({
      variables: { templateId: 'tpl-3' },
      fetchPolicy: 'network-only',
    });
    expect(within(current).getByText('Version 3 (current)')).toBeInTheDocument();
    expect(within(current).getByText(`New hero · Asha Rao · ${WHEN}`)).toBeInTheDocument();
    expect(within(current).queryByRole('button')).not.toBeInTheDocument();
    expect(within(older).getByText('Version 2')).toBeInTheDocument();
    expect(within(older).getByText(`No note · System · ${WHEN}`)).toBeInTheDocument();
  });

  it('shows a placeholder while the history loads', () => {
    gql.versions.mockReturnValue(pending());
    const { container } = renderWithProviders(
      <TemplateVersions template={TEMPLATE} onRestored={vi.fn()} />,
    );

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('shows why the history could not be read', () => {
    gql.versions.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Template not found'),
    });
    renderVersions();

    expect(screen.getByRole('alert')).toHaveTextContent('Template not found');
  });

  it('shows an empty list when there is no history', () => {
    gql.versions.mockReturnValue({ data: undefined, loading: false, error: undefined });
    renderVersions();

    expect(screen.getByRole('list')).toBeEmptyDOMElement();
  });

  it('restores an older version after confirming, then reloads', async () => {
    const { onRestored } = renderVersions();

    await userEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(await screen.findByText('Restore version 2?')).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Restore' }),
    );

    expect(await screen.findByText('Version 2 restored')).toBeInTheDocument();
    expect(gql.restore).toHaveBeenCalledWith({ variables: { templateId: 'tpl-3', version: 2 } });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the restore is declined', async () => {
    const { onRestored } = renderVersions();

    await userEvent.click(screen.getByRole('button', { name: 'Restore' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('Restore version 2?')).not.toBeInTheDocument());
    expect(gql.restore).not.toHaveBeenCalled();
    expect(onRestored).not.toHaveBeenCalled();
  });

  it('reports a failed restore', async () => {
    gql.restore.mockRejectedValue('boom');
    const { onRestored } = renderVersions();

    await userEvent.click(screen.getByRole('button', { name: 'Restore' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Restore' }),
    );

    expect(await screen.findByText('The version could not be restored')).toBeInTheDocument();
    expect(onRestored).not.toHaveBeenCalled();
  });

  it('disables restoring while a restore runs', () => {
    gql.restoring = true;
    renderVersions();

    expect(screen.getByRole('button', { name: 'Restore' })).toBeDisabled();
  });
});
