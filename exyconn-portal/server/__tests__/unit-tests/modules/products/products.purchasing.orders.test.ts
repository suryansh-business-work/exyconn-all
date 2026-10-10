import { Types } from 'mongoose';
import { PurchaseOrderModel } from '../../../../src/modules/products/purchase-order.model';
import { RolePermissionModel } from '../../../../src/modules/permissions/permission.model';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { ROLES } from '../../../../src/constants/roles';
import { codeOf } from '../codeOf';
import { CounterModel } from '../../../../src/lib/counter.model';
import { M, buyer, orderInput, seedCatalogue, type OrderRow } from './purchasing.fixtures';

beforeEach(() => invalidatePermissionCache());

describe('createPurchaseOrder', () => {
  it('draws the number and looks up the supplier and product names', async () => {
    const { supplierId, productId } = await seedCatalogue();

    const first = (await M.createPurchaseOrder(
      null,
      { input: orderInput(supplierId, productId) },
      buyer,
    )) as OrderRow;
    const second = (await M.createPurchaseOrder(
      null,
      { input: orderInput(supplierId, productId) },
      buyer,
    )) as OrderRow;

    expect(first.number).toBe('PO-0001');
    expect(second.number).toBe('PO-0002');
    expect(first.supplierName).toBe('Widgets Ltd');
    expect(first.lines[0]).toMatchObject({ productId, productName: 'Widget', quantity: 4 });
  });

  it.each([
    ['no lines at all', undefined],
    ['an empty list of lines', []],
  ])('refuses an order with %s', async (_label, lines) => {
    const { supplierId, productId } = await seedCatalogue();

    await expect(
      M.createPurchaseOrder(null, { input: orderInput(supplierId, productId, { lines }) }, buyer),
    ).rejects.toThrow(/at least one line/);
    expect(await PurchaseOrderModel.countDocuments()).toBe(0);
  });

  it('reports a supplier or product that does not exist', async () => {
    const { supplierId, productId } = await seedCatalogue();
    const missing = new Types.ObjectId().toHexString();

    expect(
      await codeOf(M.createPurchaseOrder(null, { input: orderInput(missing, productId) }, buyer)),
    ).toBe('NOT_FOUND');
    expect(
      await codeOf(M.createPurchaseOrder(null, { input: orderInput(supplierId, missing) }, buyer)),
    ).toBe('NOT_FOUND');
    expect(await PurchaseOrderModel.countDocuments()).toBe(0);
  });

  it('burns no number for a caller the matrix refuses', async () => {
    const { supplierId, productId } = await seedCatalogue();
    await RolePermissionModel.create({
      role: ROLES.PRODUCTS,
      module: 'PurchaseOrder',
      actions: ['VIEW'],
    });

    expect(
      await codeOf(
        M.createPurchaseOrder(null, { input: orderInput(supplierId, productId) }, buyer),
      ),
    ).toBe('FORBIDDEN');
    expect(await CounterModel.countDocuments()).toBe(0);
  });
});
