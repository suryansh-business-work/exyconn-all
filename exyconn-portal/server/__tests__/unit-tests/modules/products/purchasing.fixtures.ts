import { productsPurchasingResolvers } from '../../../../src/modules/products/products.purchasing';
import { ProductModel } from '../../../../src/modules/products/products.model';
import { SupplierModel } from '../../../../src/modules/products/supplier.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;

/** Shared fixtures for the purchasing suites — not a suite itself. */
export const M = productsPurchasingResolvers.Mutation as unknown as Record<string, Resolver>;

export const buyer = {
  user: { id: 'u1', email: 'buyer@exyconn.com', roles: [ROLES.PRODUCTS] },
} as unknown as GraphQLContext;

export interface OrderRow {
  id: string;
  number: string;
  status: string;
  supplierName: string;
  lines: Array<{ productId: string; productName: string; quantity: number }>;
  notes: string;
  firstReceivedAt: Date | null;
  receivedAt: Date | null;
}

export async function seedCatalogue() {
  const supplier = await SupplierModel.create({ name: 'Widgets Ltd', code: 'WID' });
  const product = await ProductModel.create({
    name: 'Widget',
    sku: 'WID-1',
    price: 250,
    category: 'Parts',
    status: 'ACTIVE',
  });
  return { supplierId: String(supplier._id), productId: String(product._id) };
}

export const orderInput = (
  supplierId: string,
  productId: string,
  over: Record<string, unknown> = {},
) => ({
  supplierId,
  supplierName: 'Typed by hand',
  lines: [{ productId, quantity: 4, unitCost: 100, taxPercent: 18 }],
  currency: 'INR',
  status: 'ORDERED',
  orderDate: new Date('2026-03-01'),
  number: 'PO-TYPED',
  ...over,
});
