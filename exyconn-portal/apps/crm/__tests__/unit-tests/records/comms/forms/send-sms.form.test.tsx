import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { CrmTimelineDocument, CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { readMemory, writeMemory } from '../../../../../src/records/comms/commsStore';
import { SendSmsForm } from '../../../../../src/records/comms/forms/send-sms';
import { renderWithProviders } from '../../../test-utils';
import { fillField, press } from '../../../form-helpers';
import { commsPanel, resetDock } from '../comms-fixtures';

const gql = vi.hoisted(() => ({ send: vi.fn(), options: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendCrmSmsMutation: (options: unknown) => {
    gql.options(options);
    return [gql.send];
  },
}));

const PANEL = commsPanel({ channel: 'SMS' });

function renderForm(panel = PANEL) {
  const onCancel = vi.fn();
  renderWithProviders(<SendSmsForm panel={panel} onCancel={onCancel} />);
  return { onCancel };
}

describe('SendSmsForm', () => {
  beforeEach(() => {
    gql.send.mockResolvedValue({ data: { sendCrmSms: true } });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    resetDock();
  });

  it('texts the first number by default and refreshes the timeline', async () => {
    renderForm();

    await fillField('Message', 'Hello Ada');
    await press('Send');

    await waitFor(() =>
      expect(gql.send).toHaveBeenCalledWith({
        variables: {
          input: {
            object: CrmTimelineObject.Contact,
            id: 'c-1',
            to: '+14155550100',
            body: 'Hello Ada',
          },
        },
      }),
    );
    expect(gql.options).toHaveBeenCalledWith({ refetchQueries: [CrmTimelineDocument] });
    expect(await screen.findByText('SMS sent to Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Message\s*\*?$/)).toHaveValue('');
  });

  it('sends for a company record', async () => {
    renderForm(commsPanel({ channel: 'SMS', object: 'COMPANY', id: 'co-4' }));

    await fillField('Message', 'Hi team');
    await press('Send');

    await waitFor(() =>
      expect(gql.send).toHaveBeenCalledWith({
        variables: {
          input: expect.objectContaining({ object: CrmTimelineObject.Company, id: 'co-4' }),
        },
      }),
    );
  });

  it('counts the characters typed against the limit', async () => {
    renderForm();

    expect(screen.getByText('0 of 1000 characters')).toBeInTheDocument();
    await fillField('Message', 'Hey');

    expect(screen.getByText('3 of 1000 characters')).toBeInTheDocument();
  });

  it('does not send an empty message', async () => {
    renderForm();

    await press('Send');

    expect(await screen.findByText('Write the message')).toBeInTheDocument();
    expect(gql.send).not.toHaveBeenCalled();
  });

  it('asks for a number when the record has none', async () => {
    renderForm(commsPanel({ channel: 'SMS', phones: [] }));

    await fillField('Message', 'Hello');
    await press('Send');

    expect(await screen.findByText('Choose the number')).toBeInTheDocument();
    expect(gql.send).not.toHaveBeenCalled();
  });

  it('shows the server reason and keeps the draft when sending fails', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('SMS provider rejected the number');
    gql.send.mockRejectedValueOnce(failure);
    renderForm();

    await fillField('Message', 'Hello Ada');
    await press('Send');

    expect(await screen.findByText('SMS provider rejected the number')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith('crm: sending an SMS failed', failure);
    expect(screen.getByLabelText(/^Message\s*\*?$/)).toHaveValue('Hello Ada');
  });

  it('keeps the draft for the next mount and starts from it', async () => {
    const first = renderWithProviders(<SendSmsForm panel={PANEL} onCancel={vi.fn()} />);
    await fillField('Message', 'Half written');
    expect(readMemory(PANEL.key, 'sms-draft')).toEqual({
      to: '+14155550100',
      body: 'Half written',
    });
    first.unmount();

    writeMemory(PANEL.key, 'sms-draft', { to: '+442079460958', body: 'Saved draft' });
    renderForm();

    expect(screen.getByLabelText(/^Message\s*\*?$/)).toHaveValue('Saved draft');
  });

  it('cancels through the panel', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
