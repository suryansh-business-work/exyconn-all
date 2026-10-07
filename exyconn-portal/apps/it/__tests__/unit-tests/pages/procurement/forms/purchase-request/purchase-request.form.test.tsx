import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ItPurchaseKind, ItPurchaseStatus } from '@exyconn/shell/graphql/generated';
import {
  PurchaseRequestForm,
  type PurchaseRequestRow,
} from '../../../../../../src/pages/procurement/forms/purchase-request';
import { renderWithProviders } from '../../../../test-utils';
import { purchaseRow } from '../../../page-kit/fixtures';
import { chooseOption, fill, optionsOf, press } from '../../../page-kit/form-actions';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateItPurchaseRequestMutation: () => [gql.create],
  useUpdateItPurchaseRequestMutation: () => [gql.update],
}));

function renderForm(initial: PurchaseRequestRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <PurchaseRequestForm initial={initial} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

function fillRequired() {
  fill('What is being bought', 'MacBook Pro 14');
  fill('Why it is needed', 'Replacing a five year old laptop');
}

describe('PurchaseRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createItPurchaseRequest: { id: 'purchase-9' } } });
    gql.update.mockResolvedValue({ data: { updateItPurchaseRequest: { id: 'purchase-1' } } });
  });

  it('asks what is being bought and why', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Say what is being bought')).toBeInTheDocument();
    expect(screen.getByText('Say why it is needed')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('never offers approval or rejection on a new request', async () => {
    renderForm();

    expect(await optionsOf('Status')).toEqual([
      'Cancelled',
      'Ordered',
      'Quoted',
      'Received',
      'Requested',
    ]);
  });

  it('creates a request with the quotes gathered for it', async () => {
    const { onDone } = renderForm();
    fillRequired();
    fill('Quantity', '2');
    fill('Estimated total cost', '4000');
    await press('Add quote');
    fill('Vendor', 'Dell');
    fill('Amount', '1850');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'MacBook Pro 14',
          kind: ItPurchaseKind.Hardware,
          quantity: 2,
          estimatedCost: 4000,
          requestedForName: '',
          justification: 'Replacing a five year old laptop',
          quotes: [{ vendor: 'Dell', amount: 1850, notes: '' }],
          status: ItPurchaseStatus.Requested,
          orderReference: '',
        },
      },
    });
    expect(await screen.findByText('Purchase request created')).toBeInTheDocument();
  });

  it('removes a quote again', async () => {
    renderForm();
    await press('Add quote');
    expect(screen.getByLabelText('Vendor')).toBeInTheDocument();

    await press('Remove quote');

    expect(screen.queryByLabelText('Vendor')).not.toBeInTheDocument();
  });

  it('checks each quote before saving', async () => {
    renderForm();
    fillRequired();
    await press('Add quote');

    await press('Create');

    expect(await screen.findByText('Vendor is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('will not mark a request quoted without a quote', async () => {
    renderForm();
    fillRequired();
    await chooseOption('Status', 'Quoted');

    await press('Create');

    expect(
      await screen.findByText('Add at least one quote before marking it quoted'),
    ).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps an approved request showing as approved and updates it by id', async () => {
    const row = purchaseRow({ id: 'purchase-3', status: ItPurchaseStatus.Approved });
    const { onDone } = renderForm(row);

    const options = await optionsOf('Status');
    expect(options).toContain('Approved');
    expect(options).not.toContain('Rejected');
    await chooseOption('Status', 'Ordered');
    fill('Supplier order reference', 'PO-2041');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'purchase-3',
        input: expect.objectContaining({
          title: 'Laptops',
          status: ItPurchaseStatus.Ordered,
          orderReference: 'PO-2041',
        }),
      },
    });
    expect(await screen.findByText('Purchase request updated')).toBeInTheDocument();
  });

  it('needs the order reference before a request is ordered', async () => {
    renderForm(purchaseRow({ status: ItPurchaseStatus.Approved }));
    await chooseOption('Status', 'Ordered');

    await press('Update');

    expect(await screen.findByText("Add the supplier's order reference")).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('keeps the form open and shows why a save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('Request is closed'));
    const { onDone } = renderForm(purchaseRow());

    await press('Update');

    expect(await screen.findByText('Request is closed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
