import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CmsDocumentStatus, CmsFragmentKind } from '@exyconn/shell/graphql/generated';
import {
  CmsFragmentForm,
  type CmsFragmentRow,
} from '../../../../../../src/pages/website/forms/cms-fragment';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCmsFragmentMutation: () => [gql.create],
  useUpdateCmsFragmentMutation: () => [gql.update],
}));

const header: CmsFragmentRow = {
  id: 'frag-1',
  siteId: 'site-1',
  name: 'Main header',
  kind: CmsFragmentKind.Header,
  status: CmsDocumentStatus.Draft,
  updatedByName: 'Asha',
  updatedAt: '2026-01-02T00:00:00.000Z',
  published: null,
};

interface Setup {
  initial?: CmsFragmentRow | null;
  onCreated?: (id: string) => void;
}

function setup({ initial = null, onCreated }: Readonly<Setup> = {}) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <CmsFragmentForm
      siteId="site-1"
      initial={initial}
      onDone={onDone}
      onCancel={onCancel}
      onCreated={onCreated}
    />,
  );
  return { user: userEvent.setup(), onDone, onCancel };
}

describe('CmsFragmentForm', () => {
  beforeEach(() => {
    gql.create.mockReset();
    gql.update.mockReset();
  });

  it('creates a section fragment under the site and hands its id over', async () => {
    gql.create.mockResolvedValue({ data: { createCmsFragment: { id: 'frag-9' } } });
    const onCreated = vi.fn();
    const { user, onDone } = setup({ onCreated });

    await user.type(screen.getByRole('textbox', { name: 'Name' }), '  Newsletter sign-up  ');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        siteId: 'site-1',
        input: { name: 'Newsletter sign-up', kind: CmsFragmentKind.Section },
      },
    });
    expect(onCreated).toHaveBeenCalledWith('frag-9');
    expect(await screen.findByText('Fragment created')).toBeInTheDocument();
  });

  it('saves the kind picked from the list', async () => {
    gql.create.mockResolvedValue({ data: { createCmsFragment: { id: 'frag-2' } } });
    const { user, onDone } = setup();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Site footer');
    await user.click(screen.getByRole('combobox', { name: 'Kind' }));
    await user.click(screen.getByRole('option', { name: 'Footer — the bottom of every page' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    // No onCreated was passed: the save still completes.
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: { siteId: 'site-1', input: { name: 'Site footer', kind: CmsFragmentKind.Footer } },
    });
  });

  it('does not report an id when the server returns no data', async () => {
    gql.create.mockResolvedValue({ data: undefined });
    const onCreated = vi.fn();
    const { user, onDone } = setup({ onCreated });

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Hero');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('requires a name and caps its length', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();

    await user.click(screen.getByRole('textbox', { name: 'Name' }));
    await user.paste('x'.repeat(101));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Keep the name under 100 characters')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('updates an existing fragment with its current values', async () => {
    gql.update.mockResolvedValue({ data: {} });
    const { user, onDone } = setup({ initial: header });

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Main header');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: { id: 'frag-1', input: { name: 'Main header', kind: CmsFragmentKind.Header } },
    });
    expect(await screen.findByText('Fragment updated')).toBeInTheDocument();
  });

  it('shows the server refusal and keeps the dialog open', async () => {
    gql.update.mockRejectedValue(new Error('A fragment with that name exists'));
    const { user, onDone } = setup({ initial: header });

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('A fragment with that name exists')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { user, onCancel } = setup();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
