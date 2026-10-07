import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  EmailConfigForm,
  type EmailConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/email-config';
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
  useCreateEmailConfigMutation: () => [gql.create],
  useUpdateEmailConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const PASSWORD = fakeSecret('smtp', 12);
const SECURE = /^Use TLS\/SSL/;
const ACTIVE = /^Set as active/;

const stored = (overrides: Partial<EmailConfigRow> = {}): EmailConfigRow => ({
  id: 'mail-1',
  label: 'Transactional',
  host: 'smtp.example.test',
  port: 465,
  secure: true,
  username: 'mailer',
  hasPassword: true,
  fromAddress: 'noreply@example.test',
  isActive: false,
  ...overrides,
});

const renderForm = (initial: EmailConfigRow | null = null) =>
  renderWithProviders(
    <EmailConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

function fillNew() {
  fill('Label', 'Transactional');
  fill('SMTP host', 'smtp.example.test');
  fill('Username', 'mailer');
  fill('Password', PASSWORD);
  fill('From address', 'noreply@example.test');
}

describe('EmailConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('starts a new config on port 587, without TLS, set active', () => {
    renderForm();
    expect(screen.getByLabelText('Port')).toHaveValue(587);
    expect(screen.getByRole('combobox', { name: SECURE })).toHaveTextContent('No');
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('Yes');
    expect(screen.getByText('Stored write-only — it is never shown again')).toBeInTheDocument();
  });

  it('asks for every required field', async () => {
    renderForm();
    await press('Create');
    await expectMessages(
      'Label is required',
      'Host is required',
      'Username is required',
      'Password is required',
      'From address is required',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('only accepts a port between 1 and 65535', async () => {
    renderForm();
    fillNew();
    fill('Port', '0');
    await press('Create');
    await expectMessages('Enter a valid port');

    fill('Port', '65536');
    await press('Create');
    await expectMessages('Enter a valid port');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a config with TLS switched on', async () => {
    renderForm();
    fillNew();
    await pickOption(SECURE, 'Yes');
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Transactional',
          host: 'smtp.example.test',
          port: 587,
          secure: true,
          username: 'mailer',
          password: PASSWORD,
          fromAddress: 'noreply@example.test',
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Email config created');
  });

  it('edits a secure, inactive config and keeps its password when left blank', async () => {
    renderForm(stored());
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: SECURE })).toHaveTextContent('Yes');
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'mail-1',
        input: {
          label: 'Transactional',
          host: 'smtp.example.test',
          port: 465,
          secure: true,
          username: 'mailer',
          password: '',
          fromAddress: 'noreply@example.test',
          isActive: false,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Email config updated');
  });

  it('reads an insecure, active config back as it is stored', async () => {
    renderForm(stored({ secure: false, isActive: true }));
    expect(screen.getByRole('combobox', { name: SECURE })).toHaveTextContent('No');
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('Yes');
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update.mock.calls[0][0].variables.input).toMatchObject({
      secure: false,
      isActive: true,
    });
  });

  it('reports a failed save', async () => {
    gql.create.mockRejectedValue(new Error('SMTP login failed'));
    renderForm();
    fillNew();
    await press('Create');
    expect(await toast()).toHaveTextContent('SMTP login failed');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
