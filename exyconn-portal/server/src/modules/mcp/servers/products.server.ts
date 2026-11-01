import { productsTypeDefs } from '../../products/products.typeDefs';
import { productsInventoryTypeDefs } from '../../products/products.inventory.typeDefs';
import { productsPurchasingTypeDefs } from '../../products/products.purchasing.typeDefs';
import { vendorStaffTypeDefs } from '../../vendor-portal/vendor.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * Products as an MCP server: the catalogue, inventory, purchasing, and the vendor portal from the
 * buyer's side (who at a supplier may sign in, and reviewing the invoices suppliers send).
 *
 * A Products feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Products module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const PRODUCTS_MCP: McpServerSpec = {
  key: 'products',
  name: 'exyconn-products',
  label: 'Products',
  role: ROLES.PRODUCTS,
  auditModule: 'Products (Claude MCP)',
  instructions:
    'Exyconn Products: the product catalogue, inventory, purchasing, vendor portal access and vendor invoice review. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting anything or placing an order.',
  typeDefs: [
    productsTypeDefs,
    productsInventoryTypeDefs,
    productsPurchasingTypeDefs,
    vendorStaffTypeDefs,
  ],
};
