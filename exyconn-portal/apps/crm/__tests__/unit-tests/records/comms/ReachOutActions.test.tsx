import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReachOutActions, type ReachOutRecord } from '../../../../src/records/comms';
import { useCommsDock } from '../../../../src/records/comms/commsStore';
import { renderWithProviders } from '../../test-utils';
import { resetDock } from './comms-fixtures';

interface Status {
  call: { ready: boolean };
  sms: { ready: boolean };
  email: { gmail: boolean; microsoft: boolean };
}

const gql = vi.hoisted(() => ({ status: undefined as Status | undefined }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmIntegrationStatusQuery: () => ({
    data: gql.status ? { crmIntegrationStatus: gql.status } : undefined,
  }),
}));

const RECORD: ReachOutRecord = {
  object: 'CONTACT',
  id: 'c-1',
  name: 'Ada Lovelace',
  phones: ['+14155550100'],
  emails: ['ada@example.com'],
};
const READY: Status = {
  call: { ready: true },
  sms: { ready: true },
  email: { gmail: false, microsoft: true },
};

function renderActions(record: ReachOutRecord = RECORD, onOpen?: () => void) {
  renderWithProviders(<ReachOutActions record={record} onOpen={onOpen} />);
}

const button = (name: string) => screen.getByRole('button', { name });

describe('ReachOutActions', () => {
  beforeEach(() => {
    gql.status = READY;
  });

  afterEach(() => {
    resetDock();
  });

  it('groups Call, SMS and Email under a Reach out heading', () => {
    renderActions();

    expect(screen.getByRole('group', { name: 'Reach out' })).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((item) => item.getAttribute('aria-label'))).toEqual([
      'Call',
      'SMS',
      'Email',
    ]);
  });

  it('opens a dock panel for the record on the chosen channel, after onOpen', async () => {
    const onOpen = vi.fn();
    const dock = renderHook(() => useCommsDock());
    renderActions(RECORD, onOpen);

    await userEvent.click(button('SMS'));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(dock.result.current.panels).toEqual([
      expect.objectContaining({ ...RECORD, channel: 'SMS', key: 'SMS:CONTACT:c-1' }),
    ]);
  });

  it('opens a panel without an onOpen callback too', async () => {
    const dock = renderHook(() => useCommsDock());
    renderActions();

    await userEvent.click(button('Email'));

    expect(dock.result.current.panels.map((panel) => panel.channel)).toEqual(['EMAIL']);
  });

  it('turns every channel off until the integration status has loaded', async () => {
    gql.status = undefined;
    const dock = renderHook(() => useCommsDock());
    renderActions();

    for (const name of ['Call', 'SMS', 'Email']) {
      expect(button(name)).toHaveAttribute('aria-disabled', 'true');
    }
    expect(button('Call')).toHaveAccessibleDescription(
      'Connect a call provider in CRM > Integrations',
    );
    expect(button('SMS')).toHaveAccessibleDescription(
      'Connect an SMS provider in CRM > Integrations',
    );
    expect(button('Email')).toHaveAccessibleDescription(
      'Connect a Gmail or Microsoft mailbox in CRM > Integrations',
    );
    await userEvent.click(button('Call'));
    expect(dock.result.current.panels).toEqual([]);
  });

  it('accepts a Gmail mailbox as an email provider', () => {
    gql.status = { ...READY, email: { gmail: true, microsoft: false } };
    renderActions();

    expect(button('Email')).not.toHaveAttribute('aria-disabled');
  });

  it('says what to add when the record has no number or address', () => {
    renderActions({ ...RECORD, phones: [], emails: [] });

    expect(button('Call')).toHaveAccessibleDescription(
      'Add a phone number to this record to call it',
    );
    expect(button('SMS')).toHaveAccessibleDescription(
      'Add a phone number to this record to text it',
    );
    expect(button('Email')).toHaveAccessibleDescription(
      'Add an email address to this record to email it',
    );
  });

  it('leaves ready channels enabled and undescribed', () => {
    renderActions();

    expect(button('Call')).not.toHaveAttribute('aria-disabled');
    expect(button('Call')).not.toHaveAccessibleDescription();
  });
});
