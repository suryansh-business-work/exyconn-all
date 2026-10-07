import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ARecordForm,
  type CmsDomainDnsRow,
} from '../../../../../../src/pages/website/forms/cms-a-record';
import { renderWithProviders } from '../../../../test-utils';
import { fillField, press } from '../content-form-helpers';

const gql = vi.hoisted(() => ({ setRecord: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSetCmsSiteARecordMutation: () => [gql.setRecord],
}));

/** Documentation addresses (RFC 5737), never real hosts. */
const SERVER_IP = ['203', '0', '113', '10'].join('.');
const CURRENT_IP = ['198', '51', '100', '7'].join('.');

const domainRow = (overrides: Partial<CmsDomainDnsRow> = {}): CmsDomainDnsRow => ({
  domain: 'exyconn.com',
  zone: 'exyconn.com',
  name: '@',
  authority: 'GODADDY',
  pointsHere: false,
  error: '',
  records: [{ ip: CURRENT_IP, ttl: 3600 }],
  ...overrides,
});

function renderForm(domain: CmsDomainDnsRow | null, serverIp = SERVER_IP) {
  const onClose = vi.fn();
  const onDone = vi.fn();
  const view = renderWithProviders(
    <ARecordForm
      siteId="site-1"
      domain={domain}
      serverIp={serverIp}
      onClose={onClose}
      onDone={onDone}
    />,
  );
  return { ...view, onClose, onDone };
}

/** Submits the record and answers the confirm dialog with `answer`. */
async function saveAndAnswer(answer: 'Update DNS' | 'Cancel') {
  await press('Save record');
  expect(await screen.findByText(`Point exyconn.com at ${CURRENT_IP}?`)).toBeInTheDocument();
  await press(answer);
}

describe('ARecordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.setRecord.mockResolvedValue({ data: { setCmsSiteARecord: true } });
  });

  it('stays closed until a domain is picked', () => {
    renderForm(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on the domain’s current record', () => {
    renderForm(domainRow());

    expect(screen.getByRole('heading', { name: 'A record for exyconn.com' })).toBeInTheDocument();
    expect(screen.getByLabelText('IPv4 address')).toHaveValue(CURRENT_IP);
    expect(screen.getByLabelText('TTL (seconds)')).toHaveValue(3600);
  });

  it('offers the websites server for a domain with no record yet', async () => {
    renderForm(domainRow({ records: [] }));
    expect(screen.getByLabelText('IPv4 address')).toHaveValue(SERVER_IP);
    expect(screen.getByLabelText('TTL (seconds)')).toHaveValue(600);

    await fillField('IPv4 address', CURRENT_IP);
    await press(`Use Exyconn server (${SERVER_IP})`);

    expect(screen.getByLabelText('IPv4 address')).toHaveValue(SERVER_IP);
  });

  it('asks for the address when the server address is not configured', () => {
    renderForm(domainRow({ records: [] }), '');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The websites server address is not configured, so enter the IP to point at.',
    );
    expect(screen.queryByRole('button', { name: /Use Exyconn server/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText('IPv4 address')).toHaveValue('');
  });

  it.each([
    ['', '600', 'Enter the IPv4 address'],
    ['256.1.1.1', '600', 'Enter an IPv4 address, like 203.0.113.10'],
    [SERVER_IP, '599', 'At least 600 seconds'],
    [SERVER_IP, '86401', 'At most 86400 seconds (a day)'],
    [SERVER_IP, '600.5', 'Use whole seconds'],
  ])('rejects ip "%s" with ttl %s: %s', async (ip, ttl, message) => {
    renderForm(domainRow());
    await userEvent.clear(screen.getByLabelText('IPv4 address'));
    if (ip) {
      await userEvent.type(screen.getByLabelText('IPv4 address'), ip);
    }
    fireEvent.change(screen.getByLabelText('TTL (seconds)'), { target: { value: ttl } });

    await press('Save record');

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(gql.setRecord).not.toHaveBeenCalled();
  });

  it('points the domain at the address once confirmed', async () => {
    const { onDone } = renderForm(domainRow());

    await saveAndAnswer('Update DNS');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.setRecord).toHaveBeenCalledWith({
      variables: { siteId: 'site-1', domain: 'exyconn.com', ip: CURRENT_IP, ttl: 3600 },
    });
    expect(await screen.findByText(`exyconn.com now points at ${CURRENT_IP}`)).toBeInTheDocument();
  });

  it('changes nothing when the confirm is cancelled', async () => {
    const { onDone } = renderForm(domainRow());

    await saveAndAnswer('Cancel');

    expect(gql.setRecord).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('reports why the provider refused the change', async () => {
    gql.setRecord.mockRejectedValue(new Error('Cloudflare rejected the record'));
    const { onDone } = renderForm(domainRow());

    await saveAndAnswer('Update DNS');

    expect(await screen.findByText('Cloudflare rejected the record')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    gql.setRecord.mockRejectedValue('timeout');
    renderForm(domainRow());

    await saveAndAnswer('Update DNS');

    expect(await screen.findByText('Could not update the DNS record')).toBeInTheDocument();
  });

  it('closes from its cancel button', async () => {
    const { onClose } = renderForm(domainRow());

    await press('Cancel');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores a save clicked while the dialog is closing', async () => {
    const { rerender } = renderForm(domainRow());
    // The wrapper stays in place on rerender: only the domain goes away.
    rerender(
      <ARecordForm
        siteId="site-1"
        domain={null}
        serverIp={SERVER_IP}
        onClose={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save record', hidden: true }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(screen.queryByText(/Point .* at/)).not.toBeInTheDocument();
    expect(gql.setRecord).not.toHaveBeenCalled();
  });
});
