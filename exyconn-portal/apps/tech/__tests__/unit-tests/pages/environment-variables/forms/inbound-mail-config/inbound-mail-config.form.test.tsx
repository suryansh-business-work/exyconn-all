import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  InboundMailConfigForm,
  type InboundMailConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/inbound-mail-config';
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
  useCreateInboundMailConfigMutation: () => [gql.create],
  useUpdateInboundMailConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const PASSWORD = fakeSecret('imap', 10);
const SECURE = /^Use TLS\/SSL/;
const DELETE = /^Delete after import/;
const ACTIVE = /^Set as active/;
const POLL = 'Read every (seconds)';

const stored = (overrides: Partial<InboundMailConfigRow> = {}): InboundMailConfigRow => ({
  id: 'in-1',
  label: 'Support inbox',
  host: 'imap.example.test',
  port: 143,
  secure: false,
  user: 'support',
  mailbox: 'Support',
  pollSeconds: 300,
  deleteAfterImport: true,
  isActive: false,
  ...overrides,
});

const renderForm = (initial: InboundMailConfigRow | null = null) =>
  renderWithProviders(
    <InboundMailConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

function fillNew() {
  fill('Label', 'Support inbox');
  fill('IMAP host', 'imap.example.test');
  fill('Username', 'support');
  fill('Password', PASSWORD);
}

describe('InboundMailConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('starts a new mailbox on IMAPS, reading INBOX every two minutes and keeping mail', () => {
    renderForm();
    expect(screen.getByLabelText('Port')).toHaveValue(993);
    expect(screen.getByLabelText('Mailbox')).toHaveValue('INBOX');
    expect(screen.getByLabelText(POLL)).toHaveValue(120);
    expect(screen.getByRole('combobox', { name: SECURE })).toHaveTextContent('Yes');
    expect(screen.getByRole('combobox', { name: DELETE })).toHaveTextContent('No');
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('Yes');
    expect(screen.getByText('Stored write-only — it is never shown again')).toBeInTheDocument();
  });

  it('needs a password to create a mailbox, along with its other details', async () => {
    renderForm();
    fill('Mailbox', '');
    await press('Create');
    await expectMessages(
      'Label is required',
      'IMAP host is required',
      'Username is required',
      'Password is required',
      'Mailbox is required',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the port and the polling interval within bounds', async () => {
    renderForm();
    fillNew();
    fill('Port', '70000');
    fill(POLL, '10');
    await press('Create');
    await expectMessages('Enter a valid port', 'Read the mailbox at most every 30 seconds');

    fill('Port', '0');
    fill(POLL, '3601');
    await press('Create');
    await expectMessages('Enter a valid port', 'Read the mailbox at least every 3600 seconds');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a mailbox that deletes what it imports', async () => {
    renderForm();
    fillNew();
    await pickOption(DELETE, 'Yes');
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Support inbox',
          host: 'imap.example.test',
          port: 993,
          secure: true,
          user: 'support',
          password: PASSWORD,
          mailbox: 'INBOX',
          pollSeconds: 120,
          deleteAfterImport: true,
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Inbound mail config created');
  });

  it('edits a stored mailbox exactly as stored, keeping the password when empty', async () => {
    renderForm(stored());
    expect(screen.getByText('Leave empty to keep the stored password')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: SECURE })).toHaveTextContent('No');
    expect(screen.getByRole('combobox', { name: DELETE })).toHaveTextContent('Yes');
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'in-1',
        input: {
          label: 'Support inbox',
          host: 'imap.example.test',
          port: 143,
          secure: false,
          user: 'support',
          password: '',
          mailbox: 'Support',
          pollSeconds: 300,
          deleteAfterImport: true,
          isActive: false,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Inbound mail config updated');
  });

  it('reads a secure, active mailbox that keeps its mail', async () => {
    renderForm(stored({ secure: true, deleteAfterImport: false, isActive: true }));
    expect(screen.getByRole('combobox', { name: SECURE })).toHaveTextContent('Yes');
    expect(screen.getByRole('combobox', { name: DELETE })).toHaveTextContent('No');
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('Yes');
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('IMAP login failed'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('IMAP login failed');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
