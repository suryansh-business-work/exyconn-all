import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { CrmTimelineDocument, CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { writeMemory } from '../../../../../src/records/comms/commsStore';
import { readAgentPhone, saveAgentPhone } from '../../../../../src/records/comms/agentPhone';
import { StartCallForm } from '../../../../../src/records/comms/forms/start-call';
import { renderWithProviders } from '../../../test-utils';
import { fillField, press } from '../../../form-helpers';
import { commsPanel, resetDock } from '../comms-fixtures';

const gql = vi.hoisted(() => ({ startCall: vi.fn(), options: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useStartCrmCallMutation: (options: unknown) => {
    gql.options(options);
    return [gql.startCall];
  },
}));

const PANEL = commsPanel({ channel: 'CALL' });

function renderForm(panel = PANEL) {
  const props = { onStarted: vi.fn(), onFailed: vi.fn(), onCancel: vi.fn() };
  renderWithProviders(<StartCallForm panel={panel} {...props} />);
  return props;
}

describe('StartCallForm', () => {
  beforeEach(() => {
    gql.startCall.mockResolvedValue({ data: { startCrmCall: true } });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    globalThis.localStorage.clear();
    resetDock();
  });

  it('rings the agent phone for the first number and remembers that phone', async () => {
    const { onStarted, onFailed } = renderForm();

    await fillField('Your phone', '+442079460958');
    await press('Call');

    await waitFor(() => expect(onStarted).toHaveBeenCalledTimes(1));
    expect(gql.startCall).toHaveBeenCalledWith({
      variables: {
        input: {
          object: CrmTimelineObject.Contact,
          id: 'c-1',
          to: '+14155550100',
          agentPhone: '+442079460958',
        },
      },
    });
    expect(gql.options).toHaveBeenCalledWith({ refetchQueries: [CrmTimelineDocument] });
    expect(readAgentPhone()).toBe('+442079460958');
    expect(onFailed).not.toHaveBeenCalled();
  });

  it('fills in the phone saved on this browser and calls for a company', async () => {
    saveAgentPhone('+442079460958');
    const { onStarted } = renderForm(
      commsPanel({ channel: 'CALL', object: 'COMPANY', id: 'co-2' }),
    );

    expect(screen.getByLabelText(/^Your phone\s*\*?$/)).toHaveValue('+442079460958');
    await press('Call');

    await waitFor(() => expect(onStarted).toHaveBeenCalled());
    expect(gql.startCall).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({ object: CrmTimelineObject.Company, id: 'co-2' }),
      },
    });
  });

  it('starts from the remembered draft', () => {
    writeMemory(PANEL.key, 'call-draft', { to: '+14155550100', agentPhone: '+15550001111' });

    renderForm();

    expect(screen.getByLabelText(/^Your phone\s*\*?$/)).toHaveValue('+15550001111');
  });

  it('does not call without a valid agent phone', async () => {
    renderForm();

    await fillField('Your phone', '0415');
    await press('Call');

    expect(
      await screen.findByText('Enter your number in international format, e.g. +14155550100'),
    ).toBeInTheDocument();
    expect(gql.startCall).not.toHaveBeenCalled();
  });

  it('asks for a number when the record has none', async () => {
    renderForm(commsPanel({ channel: 'CALL', phones: [] }));

    await fillField('Your phone', '+442079460958');
    await press('Call');

    expect(await screen.findByText('Choose the number')).toBeInTheDocument();
  });

  it('reports the reason when the call cannot be placed, without saving the phone', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('Call provider is not configured');
    gql.startCall.mockRejectedValueOnce(failure);
    const { onStarted, onFailed } = renderForm();

    await fillField('Your phone', '+442079460958');
    await press('Call');

    await waitFor(() => expect(onFailed).toHaveBeenCalledWith('Call provider is not configured'));
    expect(warn).toHaveBeenCalledWith('crm: starting a call failed', failure);
    expect(onStarted).not.toHaveBeenCalled();
    expect(readAgentPhone()).toBe('');
  });
});
