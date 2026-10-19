import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { CrmCallProvider } from '@exyconn/shell/graphql/generated';
import { CrmCallConfigForm } from '../../../../../../src/pages/integrations/forms/crm-call-config';
import { renderWithProviders } from '../../../../test-utils';
import { chooseOption, fillField, optionsOf, press } from '../../../../form-helpers';
import { callConfigRow, TWILIO_SID } from '../../integration-fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCrmCallConfigMutation: () => [gql.create],
  useUpdateCrmCallConfigMutation: () => [gql.update],
}));

function renderForm(initial: ReturnType<typeof callConfigRow> | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<CrmCallConfigForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('CrmCallConfigForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createCrmCallConfig: { id: 'call-9' } } });
    gql.update.mockResolvedValue({ data: { updateCrmCallConfig: { id: 'call-1' } } });
  });

  it('offers Twilio and Vobiz, with Twilio help by default', async () => {
    renderForm();

    expect(await optionsOf('Provider')).toEqual(['Twilio', 'Vobiz']);
    expect(screen.getByLabelText('Account SID')).toBeInTheDocument();
    expect(screen.getByText('Twilio console > Account info: starts with AC')).toBeInTheDocument();
    expect(screen.getByText('Shown next to the account id in the console')).toBeInTheDocument();
  });

  it('refuses an incomplete account without saving', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Give it a name')).toBeInTheDocument();
    expect(screen.getByText('Enter the auth token')).toBeInTheDocument();
    expect(
      screen.getByText('A Twilio Account SID starts with AC, then 32 letters and digits'),
    ).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a Vobiz account under its own labels', async () => {
    const { onDone } = renderForm();
    await fillField('Label', 'Support line');
    await chooseOption('Provider', 'Vobiz');

    expect(screen.getByText('Vobiz console > API credentials')).toBeInTheDocument();
    await fillField('Auth ID', 'MA_1234');
    await fillField('Auth token', 'secret');
    await fillField('From number', '+919876543210');
    await chooseOption('Set as active', 'No');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Support line',
          provider: CrmCallProvider.Vobiz,
          accountId: 'MA_1234',
          authToken: 'secret',
          fromNumber: '+919876543210',
          isActive: false,
        },
      },
    });
  });

  it('updates a stored account by id, keeping the token when left blank', async () => {
    const { onDone } = renderForm(callConfigRow());

    expect(screen.getByLabelText('Label')).toHaveValue('Sales line');
    expect(screen.getByText('Leave blank to keep the stored value')).toBeInTheDocument();
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'call-1',
        input: {
          label: 'Sales line',
          provider: CrmCallProvider.Twilio,
          fromNumber: '+14155550100',
          accountId: TWILIO_SID,
          authToken: '',
          isActive: true,
        },
      },
    });
  });
});
