import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialApp } from '@exyconn/shell/graphql/generated';
import {
  SocialAppForm,
  type SocialAppRow,
} from '../../../../../../src/pages/environment-variables/forms/social-app';
import { renderWithProviders } from '../../../../test-utils';
import {
  doneOnce,
  expectMessages,
  fakeSecret,
  fill,
  formCallbacks,
  press,
  toast,
} from '../form.helpers';

const gql = vi.hoisted(() => ({ save: vi.fn() }));
/** The options the form handed `useEntitySave` on its last render. */
const saved = vi.hoisted(() => ({
  options: null as null | { create: (values: unknown) => Promise<unknown> },
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveSocialAppConfigMutation: () => [gql.save],
}));

vi.mock('@exyconn/shell/components/form/useEntitySave', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@exyconn/shell/components/form/useEntitySave')>();
  return {
    ...actual,
    useEntitySave: (options: Parameters<typeof actual.useEntitySave>[0]) => {
      saved.options = options;
      return actual.useEntitySave(options);
    },
  };
});

const cb = formCallbacks();
const SECRET = fakeSecret('cs', 20);
const SWITCH = 'Let Marketing connect accounts with this app';

const row = (overrides: Partial<SocialAppRow> = {}): SocialAppRow => ({
  id: 'app-1',
  app: SocialApp.Linkedin,
  label: 'LinkedIn',
  consoleUrl: 'https://developer.linkedin.example/apps',
  callbackUrl: 'https://api.example.test/oauth/linkedin/callback',
  clientId: '',
  hasClientSecret: false,
  clientSecretHint: null,
  enabled: false,
  ...overrides,
});

const renderForm = (value: SocialAppRow = row()) =>
  renderWithProviders(<SocialAppForm row={value} onDone={cb.onDone} onCancel={cb.onCancel} />);

describe('SocialAppForm', () => {
  beforeEach(() => {
    gql.save.mockReset().mockResolvedValue({ data: {} });
    saved.options = null;
    cb.reset();
  });

  it('walks through the console steps with the exact redirect URL', () => {
    renderForm();
    expect(
      screen.getByText(/1\. Create an app in the LinkedIn developer console\./),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the console' })).toHaveAttribute(
      'href',
      'https://developer.linkedin.example/apps',
    );
    expect(
      screen.getByText('https://api.example.test/oauth/linkedin/callback'),
    ).toBeInTheDocument();
    expect(screen.getByText('Shown once in the provider console.')).toBeInTheDocument();
  });

  it('will not turn an app on without both halves of its credentials', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('switch', { name: SWITCH }));
    await press('Save');
    await expectMessages(
      'Add the client ID before turning the app on',
      'Add the client secret before turning the app on',
    );
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('turns an app on with a new client ID and secret', async () => {
    renderForm();
    fill('Client ID', 'li-client');
    fill('Client secret', SECRET);
    await userEvent.click(screen.getByRole('switch', { name: SWITCH }));
    await press('Save');

    await doneOnce(cb.onDone);
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        input: {
          app: SocialApp.Linkedin,
          clientId: 'li-client',
          clientSecret: SECRET,
          enabled: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('LinkedIn app updated');
  });

  it('counts a stored secret, so an enabled app saves with the secret left blank', async () => {
    renderForm(row({ clientId: 'li-client', hasClientSecret: true, enabled: true }));
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    expect(screen.getByLabelText('Client ID')).toHaveValue('li-client');
    expect(screen.getByRole('switch', { name: SWITCH })).toBeChecked();
    await press('Save');

    await doneOnce(cb.onDone);
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        input: { app: SocialApp.Linkedin, clientId: 'li-client', clientSecret: '', enabled: true },
      },
    });
  });

  it('saves a switched-off app with empty credentials', async () => {
    renderForm();
    await press('Save');
    await doneOnce(cb.onDone);
    expect(gql.save.mock.calls[0][0].variables.input).toEqual({
      app: SocialApp.Linkedin,
      clientId: '',
      clientSecret: '',
      enabled: false,
    });
  });

  it('refuses values far too long to be credentials', async () => {
    renderForm();
    fill('Client ID', 'i'.repeat(301));
    fill('Client secret', 's'.repeat(501));
    await press('Save');
    await expectMessages(
      'That is too long for a client ID',
      'That is too long for a client secret',
    );
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('never creates a record: every app already exists, so create sends nothing', async () => {
    renderForm();
    await expect(saved.options?.create({})).resolves.toBeUndefined();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('reports a failed save and stays open', async () => {
    gql.save.mockRejectedValue(new Error('Client ID rejected by LinkedIn'));
    renderForm();
    await press('Save');
    expect(await toast()).toHaveTextContent('Client ID rejected by LinkedIn');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
