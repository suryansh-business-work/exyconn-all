import { ProductModel } from './products.model';
import { productsTypeDefs } from './products.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface ProductInput {
  name: string;
  sku: string;
  price: number;
  category: string;
  stock: number;
  status: string;
}

export const productsService = createCrudService<ProductInput>(ProductModel as never, 'Product');
export const productsResolvers = createCrudResolvers(productsService, {
  name: 'Product',
  roles: [ROLES.PRODUCTS],
  table: {
    searchFields: ['name', 'sku', 'category'],
    filterFields: ['name', 'sku', 'category', 'status'],
    sortFields: ['name', 'sku', 'price', 'category', 'stock', 'status', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status'], sum: ['stock'] },
});
export { productsTypeDefs };
