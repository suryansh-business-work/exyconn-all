import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ItCloudKind, ItEnvironment, ItServiceStatus } from '@exyconn/shell/graphql/generated';
import {
  CloudResourceForm,
  type CloudResourceRow,
} from '../../../../../../src/pages/cloud/forms/cloud-resource';
import { cloudRow } from '../../../../core/rows.fixtures';
import { fill, pickOption, press, toast } from '../../../../core/form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateItCloudResourceMutation: () => [gql.create],
  useUpdateItCloudResourceMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: CloudResourceRow | null = null) =>
  renderWithProviders(<CloudResourceForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('CloudResourceForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('asks for a name people will recognise', async () => {
    renderForm();
    await press('Create');
    expect(await screen.findByText('Give it a name people will recognise')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('registers an active production server that does not expire', async () => {
    renderForm();
    fill('Name', 'api.exyconn.com');
    fill('Provider', 'Hetzner');
    fill('Monthly cost', '45');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'api.exyconn.com',
          kind: ItCloudKind.Server,
          provider: 'Hetzner',
          environment: ItEnvironment.Production,
          region: '',
          endpoint: '',
          expiresAt: null,
          monthlyCost: 45,
          status: ItServiceStatus.Active,
          ownerName: '',
          notes: '',
        },
      },
    });
    expect(await toast()).toHaveTextContent('Cloud resource created');
  });

  it('will not register a certificate without its expiry', async () => {
    renderForm();
    fill('Name', 'exyconn.com');
    await pickOption(/^Kind/, 'Ssl Certificate');
    await press('Create');
    expect(
      await screen.findByText('A domain or certificate needs its expiry date'),
    ).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a negative monthly cost', async () => {
    renderForm();
    fill('Name', 'prod-db-1');
    fill('Monthly cost', '-1');
    await press('Create');
    expect(await screen.findByText('Cost cannot be negative')).toBeInTheDocument();
  });

  it('saves an edit, keeping the expiry it already has', async () => {
    renderForm(
      cloudRow({
        kind: ItCloudKind.Domain,
        name: 'exyconn.com',
        expiresAt: '2027-03-01T00:00:00.000Z',
      }),
    );
    expect(screen.getByLabelText('Name')).toHaveValue('exyconn.com');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'cloud-1',
        input: expect.objectContaining({
          kind: ItCloudKind.Domain,
          expiresAt: '2027-03-01T00:00:00.000Z',
          monthlyCost: 1200,
        }),
      },
    });
    expect(await toast()).toHaveTextContent('Cloud resource updated');
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('Name already registered'));
    renderForm(cloudRow());
    await press('Update');
    expect(await toast()).toHaveTextContent('Name already registered');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
