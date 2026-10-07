import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  SlackConfigForm,
  type SlackConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/slack-config';
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
  useCreateSlackConfigMutation: () => [gql.create],
  useUpdateSlackConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const BOT_TOKEN = fakeSecret('xoxb-', 20);
const SIGNING_SECRET = fakeSecret('sign', 16);
const ACTIVE = /^Set as active/;

const stored = (overrides: Partial<SlackConfigRow> = {}): SlackConfigRow => ({
  id: 'sl-1',
  label: 'Workspace',
  hasBotToken: true,
  botTokenHint: 'b0t1',
  hasSigningSecret: true,
  defaultChannel: '#releases',
  isActive: true,
  ...overrides,
});

const renderForm = (initial: SlackConfigRow | null = null) =>
  renderWithProviders(
    <SlackConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

function fillNew(token = BOT_TOKEN) {
  fill('Label', 'Workspace');
  fill('Bot token', token);
  fill('Default channel', '#releases');
}

describe('SlackConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('marks the signing secret optional on a new config', () => {
    renderForm();
    expect(
      screen.getByText('Optional. Lets website chat agents reply from Slack threads.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Slack app bot token \(xoxb-…\)/)).toBeInTheDocument();
  });

  it('asks for a label, a bot token and a default channel', async () => {
    renderForm();
    await press('Create');
    await expectMessages(
      'Label is required',
      'Bot token is required',
      'Default channel is required',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a user token and an overlong channel', async () => {
    renderForm();
    fillNew(fakeSecret('xoxp-', 20));
    fill('Default channel', `#${'c'.repeat(80)}`);
    await press('Create');
    await expectMessages('A Slack bot token starts with "xoxb-"', 'Channel name is too long');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a config without a signing secret, sending none', async () => {
    renderForm();
    fillNew();
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Workspace',
          botToken: BOT_TOKEN,
          signingSecret: undefined,
          defaultChannel: '#releases',
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Slack config created');
  });

  it('sends a signing secret once one is typed', async () => {
    renderForm();
    fillNew();
    fill('Signing secret', SIGNING_SECRET);
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create.mock.calls[0][0].variables.input.signingSecret).toBe(SIGNING_SECRET);
  });

  it('edits a config with a stored signing secret, keeping both secrets', async () => {
    renderForm(stored());
    expect(screen.getByText(/^Signing secret stored\./)).toBeInTheDocument();
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    await pickOption(ACTIVE, 'No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'sl-1',
        input: {
          label: 'Workspace',
          botToken: '',
          signingSecret: undefined,
          defaultChannel: '#releases',
          isActive: false,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Slack config updated');
  });

  it('says when an edited config has no signing secret yet', () => {
    renderForm(stored({ hasSigningSecret: false, isActive: false }));
    expect(screen.getByText(/No signing secret stored yet\./)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('invalid_auth'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('invalid_auth');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
