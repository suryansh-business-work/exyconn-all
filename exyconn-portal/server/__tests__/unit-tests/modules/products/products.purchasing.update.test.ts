import { Types } from 'mongoose';
import { PurchaseOrderModel } from '../../../../src/modules/products/purchase-order.model';
import { RolePermissionModel } from '../../../../src/modules/permissions/permission.model';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { ROLES } from '../../../../src/constants/roles';
import { codeOf } from '../codeOf';
import { M, buyer, orderInput, seedCatalogue, type OrderRow } from './purchasing.fixtures';

beforeEach(() => invalidatePermissionCache());

async function seedOrder() {
  const { supplierId, productId } = await seedCatalogue();
  const order = (await M.createPurchaseOrder(
    null,
    { input: orderInput(supplierId, productId) },
    buyer,
  )) as OrderRow;
  return { supplierId, productId, order };
}

describe('updatePurchaseOrder', () => {
  it('rewrites the lines but keeps the drawn number', async () => {
    const { supplierId, productId, order } = await seedOrder();

    const updated = (await M.updatePurchaseOrder(
      null,
      {
        id: order.id,
        input: orderInput(supplierId, productId, {
          number: 'PO-9999',
          notes: 'Rush',
          lines: [{ productId, quantity: 9, unitCost: 90, taxPercent: 0 }],
        }),
      },
      buyer,
    )) as OrderRow;

    expect(updated).toMatchObject({ number: 'PO-0001', notes: 'Rush' });
    expect(updated.lines[0]).toMatchObject({ quantity: 9, productName: 'Widget' });
  });

  it('refuses to change an order that has started arriving', async () => {
    const { supplierId, productId, order } = await seedOrder();
    await PurchaseOrderModel.updateOne({ _id: order.id }, { 'lines.0.receivedQuantity': 1 });

    await expect(
      M.updatePurchaseOrder(
        null,
        { id: order.id, input: orderInput(supplierId, productId, { notes: 'Late' }) },
        buyer,
      ),
    ).rejects.toThrow(/already arrived/);
  });

  it('reports an order that does not exist', async () => {
    const { supplierId, productId } = await seedCatalogue();

    expect(
      await codeOf(
        M.updatePurchaseOrder(
          null,
          { id: new Types.ObjectId().toHexString(), input: orderInput(supplierId, productId) },
          buyer,
        ),
      ),
    ).toBe('NOT_FOUND');
  });

  it('accepts orders stored before lines or receipts were tracked', async () => {
    const { supplierId, productId } = await seedCatalogue();
    const legacy = (number: string, lines?: unknown[]) => ({
      number,
      supplierId,
      currency: 'INR',
      status: 'DRAFT',
      orderDate: new Date('2026-01-01'),
      ...(lines ? { lines } : {}),
    });
    const line = { productId, productName: 'Widget', quantity: 1, unitCost: 5, taxPercent: 0 };
    const { insertedIds } = await PurchaseOrderModel.collection.insertMany([
      legacy('PO-NOLINES'),
      legacy('PO-NORECEIPTS', [line]),
    ]);

    for (const [index, number] of ['PO-NOLINES', 'PO-NORECEIPTS'].entries()) {
      const updated = (await M.updatePurchaseOrder(
        null,
        { id: String(insertedIds[index]), input: orderInput(supplierId, productId) },
        buyer,
      )) as OrderRow;
      expect(updated.number).toBe(number);
    }
  });

  it('refuses an edit the matrix blocks before reading the order', async () => {
    const { supplierId, productId } = await seedCatalogue();
    await RolePermissionModel.create({
      role: ROLES.PRODUCTS,
      module: 'PurchaseOrder',
      actions: ['VIEW', 'CREATE'],
    });

    expect(
      await codeOf(
        M.updatePurchaseOrder(
          null,
          { id: new Types.ObjectId().toHexString(), input: orderInput(supplierId, productId) },
          buyer,
        ),
      ),
    ).toBe('FORBIDDEN');
  });
});
