import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  SonarConfigForm,
  type SonarConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/sonar-config';
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
  useCreateSonarConfigMutation: () => [gql.create],
  useUpdateSonarConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const TOKEN = fakeSecret('squ_', 20);
const ACTIVE = /^Set as active/;

const stored = (overrides: Partial<SonarConfigRow> = {}): SonarConfigRow => ({
  id: 's1',
  label: 'SonarCloud',
  hostUrl: 'https://sonarcloud.io',
  projectKey: 'exyconn_all',
  organization: 'exyconn',
  hasToken: true,
  tokenHint: 'wxyz',
  isActive: true,
  ...overrides,
});

const renderForm = (initial: SonarConfigRow | null = null) =>
  renderWithProviders(
    <SonarConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

function fillNew() {
  fill('Label', 'Self-hosted');
  fill('Server URL', 'https://sonar.example.test');
  fill('Token', TOKEN);
  fill('Project key', 'com.exyconn:portal');
}

describe('SonarConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('asks for the label, server, token and project when creating', async () => {
    renderForm();
    expect(
      screen.getByText('A user token with Browse permission on the project'),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('Yes');
    await press('Create');
    await expectMessages(
      'Label is required',
      'Server URL is required',
      'Token is required',
      'Project key is required',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('wants a valid URL, and then an https one', async () => {
    renderForm();
    fillNew();
    fill('Server URL', 'sonar.example.test');
    await press('Create');
    await expectMessages('Enter a valid URL');

    fill('Server URL', 'http://sonar.example.test');
    await press('Create');
    await expectMessages('Use an https:// address');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('checks the project and organization keys and the label length', async () => {
    renderForm();
    fillNew();
    fill('Label', 'x'.repeat(81));
    fill('Project key', '12345');
    fill('Organization key', 'Exyconn Ltd');
    await press('Create');
    await expectMessages(
      'Keep the label under 80 characters',
      'Use the project key exactly as SonarQube shows it',
      'Use the organization key, not its name',
    );

    fill('Project key', 'p'.repeat(401));
    fill('Organization key', 'o'.repeat(256));
    await press('Create');
    await expectMessages(
      'A project key is at most 400 characters',
      'An organization key is at most 255 characters',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a self-hosted config with no organization', async () => {
    renderForm();
    fillNew();
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Self-hosted',
          hostUrl: 'https://sonar.example.test',
          token: TOKEN,
          projectKey: 'com.exyconn:portal',
          organization: '',
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('SonarQube config created');
  });

  it('accepts an upper-case HTTPS scheme and a SonarCloud organization', async () => {
    renderForm();
    fillNew();
    fill('Server URL', 'HTTPS://SONARCLOUD.IO');
    fill('Organization key', 'exyconn');
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create.mock.calls[0][0].variables.input).toMatchObject({
      hostUrl: 'HTTPS://SONARCLOUD.IO',
      organization: 'exyconn',
    });
  });

  it('edits a stored config, keeping its token, and can deactivate it', async () => {
    renderForm(stored());
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    await pickOption(ACTIVE, 'No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 's1',
        input: {
          label: 'SonarCloud',
          hostUrl: 'https://sonarcloud.io',
          token: '',
          projectKey: 'exyconn_all',
          organization: 'exyconn',
          isActive: false,
        },
      },
    });
    expect(await toast()).toHaveTextContent('SonarQube config updated');
  });

  it('reads an inactive config back as inactive', () => {
    renderForm(stored({ isActive: false }));
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('Project not found'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('Project not found');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
