import type { ListProductsQuery, ProductStatus } from '@exyconn/shell/graphql/generated';

export type ProductRow = ListProductsQuery['listProducts'][number];

export interface ProductFormValues {
  name: string;
  sku: string;
  price: number;
  category: string;
  stock: number;
  status: ProductStatus;
}
