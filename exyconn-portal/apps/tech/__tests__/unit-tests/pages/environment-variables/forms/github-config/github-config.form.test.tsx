import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  GithubConfigForm,
  type GithubConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/github-config';
import { renderWithProviders } from '../../../../test-utils';
import {
  doneOnce,
  expectMessages,
  fakeSecret,
  fill,
  formCallbacks,
  pickOption,
  press,
  toast,
} from '../form.helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateGithubConfigMutation: () => [gql.create],
  useUpdateGithubConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const TOKEN = fakeSecret('github_pat_', 30);
const ACTIVE = /^Set as active/;

const stored = (overrides: Partial<GithubConfigRow> = {}): GithubConfigRow => ({
  id: 'gh-1',
  label: 'Builds',
  owner: 'exyconn',
  repo: 'exyconn-all',
  hasToken: true,
  tokenHint: 'abcd',
  isActive: true,
  ...overrides,
});

const renderForm = (initial: GithubConfigRow | null = null) =>
  renderWithProviders(
    <GithubConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('GithubConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('asks for the label, repository and a token when creating', async () => {
    renderForm();
    expect(screen.getByText(/Actions: read and write/)).toBeInTheDocument();
    await press('Create');
    await expectMessages(
      'Label is required',
      'Owner is required',
      'Repository is required',
      'Access token is required',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('wants the owner and repository exactly as they appear in the URL', async () => {
    renderForm();
    fill('Label', 'Builds');
    fill('Owner', 'Exy Conn');
    fill('Repository', 'exyconn/all');
    fill('Access token', TOKEN);
    await press('Create');
    await expectMessages(
      'Use the owner exactly as it appears in the repository URL',
      'Use the repository name exactly as it appears in its URL',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates an active repository credential', async () => {
    renderForm();
    fill('Label', 'Builds');
    fill('Owner', 'exyconn');
    fill('Repository', 'exyconn-all');
    fill('Access token', TOKEN);
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Builds',
          owner: 'exyconn',
          repo: 'exyconn-all',
          token: TOKEN,
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('GitHub config created');
  });

  it('updates a stored credential, keeping its token, and can deactivate it', async () => {
    renderForm(stored());
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('Yes');
    await pickOption(ACTIVE, 'No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'gh-1',
        input: {
          label: 'Builds',
          owner: 'exyconn',
          repo: 'exyconn-all',
          token: '',
          isActive: false,
        },
      },
    });
    expect(await toast()).toHaveTextContent('GitHub config updated');
  });

  it('reads an inactive credential back as inactive', async () => {
    renderForm(stored({ isActive: false }));
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update.mock.calls[0][0].variables.input.isActive).toBe(false);
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('Token lacks Actions access'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('Token lacks Actions access');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
