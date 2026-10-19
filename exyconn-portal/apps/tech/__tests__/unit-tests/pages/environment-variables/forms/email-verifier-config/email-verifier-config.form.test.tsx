import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  EmailVerifierConfigForm,
  type EmailVerifierConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/email-verifier-config';
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
  useCreateEmailVerifierConfigMutation: () => [gql.create],
  useUpdateEmailVerifierConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const PASSWORD = fakeSecret('px', 16);

const stored = (overrides: Partial<EmailVerifierConfigRow> = {}): EmailVerifierConfigRow => ({
  id: 'ev-1',
  label: 'Port 25 proxy',
  proxyHost: 'proxy.example.com',
  proxyPort: 9050,
  proxyUsername: 'checker',
  hasProxyPassword: true,
  isActive: true,
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

const renderForm = (initial: EmailVerifierConfigRow | null = null) =>
  renderWithProviders(
    <EmailVerifierConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('EmailVerifierConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('starts on the SOCKS5 port and asks only for a label', async () => {
    renderForm();
    expect(screen.getByLabelText('Proxy port')).toHaveValue(1080);
    expect(screen.getByText('Only if the proxy asks for one')).toBeInTheDocument();
    await press('Create');
    await expectMessages('Label is required');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a host that is not a host name and a port out of range', async () => {
    renderForm();
    fill('Label', 'Proxy');
    fill('SOCKS5 proxy host', 'not a host!');
    fill('Proxy port', '70000');
    await press('Create');
    await expectMessages('Enter a host name, e.g. proxy.example.com', 'Port is 1–65535');
    fill('Proxy port', '0');
    await press('Create');
    await expectMessages('Port is 1–65535');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a config that checks without a proxy', async () => {
    renderForm();
    fill('Label', 'Direct');
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Direct',
          proxyHost: '',
          proxyPort: 1080,
          proxyUsername: '',
          proxyPassword: '',
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Email verifier config created');
  });

  it('creates a proxy with its credentials, the port as a number', async () => {
    renderForm();
    fill('Label', 'Proxy');
    fill('SOCKS5 proxy host', 'proxy.example.com');
    fill('Proxy port', '9050');
    fill('Proxy username', 'checker');
    fill('Proxy password', PASSWORD);
    await pickOption(/^Set as active/, 'No');
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Proxy',
          proxyHost: 'proxy.example.com',
          proxyPort: 9050,
          proxyUsername: 'checker',
          proxyPassword: PASSWORD,
          isActive: false,
        },
      },
    });
  });

  it('keeps the stored password when an edit leaves it blank', async () => {
    renderForm(stored());
    expect(screen.getByLabelText('SOCKS5 proxy host')).toHaveValue('proxy.example.com');
    expect(screen.getByLabelText('Proxy port')).toHaveValue(9050);
    expect(screen.getByLabelText('Proxy username')).toHaveValue('checker');
    expect(
      screen.getByText('Saved. Use the eye to see it, or type a new one to replace it.'),
    ).toBeInTheDocument();
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'ev-1',
        input: {
          label: 'Port 25 proxy',
          proxyHost: 'proxy.example.com',
          proxyPort: 9050,
          proxyUsername: 'checker',
          proxyPassword: '',
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Email verifier config updated');
  });

  it('keeps an inactive config inactive', async () => {
    renderForm(stored({ isActive: false, hasProxyPassword: false }));
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update.mock.calls[0][0].variables.input.isActive).toBe(false);
  });

  it('reports a failed save and stays open', async () => {
    gql.update.mockRejectedValue(new Error('Proxy host refused'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('Proxy host refused');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
