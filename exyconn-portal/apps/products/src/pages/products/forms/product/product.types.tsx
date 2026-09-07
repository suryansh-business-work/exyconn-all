import type { ListProductsQuery, ProductStatus } from '@exyconn/shell/graphql/generated';

export type ProductRow = ListProductsQuery['listProducts'][number];

export interface ProductFormValues {
  name: string;
  sku: string;
  price: number;
  category: string;
  /** Opening stock — only asked for on create; afterwards the ledger moves it. */
  stock?: number;
  reorderLevel: number;
  status: ProductStatus;
}
