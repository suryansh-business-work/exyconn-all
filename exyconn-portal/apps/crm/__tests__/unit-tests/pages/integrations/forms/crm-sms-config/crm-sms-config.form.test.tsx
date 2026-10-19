import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { CrmSmsProvider } from '@exyconn/shell/graphql/generated';
import { CrmSmsConfigForm } from '../../../../../../src/pages/integrations/forms/crm-sms-config';
import { renderWithProviders } from '../../../../test-utils';
import { chooseOption, fillField, optionsOf, press } from '../../../../form-helpers';
import { smsConfigRow, TWILIO_SID } from '../../integration-fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCrmSmsConfigMutation: () => [gql.create],
  useUpdateCrmSmsConfigMutation: () => [gql.update],
}));

function renderForm(initial: ReturnType<typeof smsConfigRow> | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<CrmSmsConfigForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('CrmSmsConfigForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createCrmSmsConfig: { id: 'sms-9' } } });
    gql.update.mockResolvedValue({ data: { updateCrmSmsConfig: { id: 'sms-1' } } });
  });

  it('shows the Twilio fields for a new account', async () => {
    renderForm();

    expect(await optionsOf('Provider')).toEqual(['Twilio', 'MSG91']);
    expect(screen.getByLabelText('Account SID')).toBeInTheDocument();
    expect(screen.getByLabelText('From number')).toBeInTheDocument();
    expect(screen.queryByLabelText('Sender ID')).not.toBeInTheDocument();
    expect(
      screen.getByText('Shown next to the Account SID in the Twilio console'),
    ).toBeInTheDocument();
  });

  it('creates a Twilio account', async () => {
    const { onDone } = renderForm();
    await fillField('Label', 'Sales texts');
    await fillField('Account SID', TWILIO_SID);
    await fillField('From number', '+14155550100');
    await fillField('Auth token', 'secret');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Sales texts',
          provider: CrmSmsProvider.Twilio,
          authToken: 'secret',
          isActive: true,
          fromNumber: '+14155550100',
          accountId: TWILIO_SID,
        },
      },
    });
  });

  it('switches to the DLT fields and auth key for MSG91 and checks them', async () => {
    const { onDone } = renderForm();
    await fillField('Label', 'India texts');
    await chooseOption('Provider', 'MSG91');

    expect(screen.queryByLabelText('Account SID')).not.toBeInTheDocument();
    expect(screen.getByText('MSG91 > Settings > API keys')).toBeInTheDocument();
    expect(screen.getByLabelText('Template variable name')).toHaveValue('message');
    await fillField('Sender ID', 'EX');
    await fillField('Auth key', 'key-1');
    await press('Create');

    expect(await screen.findByText('Enter the DLT sender id, e.g. EXYCON')).toBeInTheDocument();
    expect(screen.getByText('Enter the MSG91 flow template id')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();

    await fillField('Sender ID', 'EXYCON');
    await fillField('Template ID', 'flow-1');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'India texts',
          provider: CrmSmsProvider.Msg91,
          authToken: 'key-1',
          isActive: true,
          senderId: 'EXYCON',
          templateId: 'flow-1',
          messageVariable: 'message',
        },
      },
    });
  });

  it('updates a stored account by id, keeping the token when left blank', async () => {
    const { onDone } = renderForm(smsConfigRow());

    expect(screen.getByText('Leave blank to keep the stored value')).toBeInTheDocument();
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'sms-1',
        input: expect.objectContaining({ label: 'Sales texts', authToken: '' }),
      },
    });
  });
});
