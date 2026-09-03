import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { ProductsOverviewPage, ProductsPage } from './pages/products';
import { SuppliersPage } from './pages/suppliers';
import { StockPage } from './pages/stock';

/** Products micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.PRODUCTS} homePath="/products">
      <Route path="/products" element={<ProductsOverviewPage />} />
      <Route path="/products/catalogue" element={<ProductsPage />} />
      <Route path="/products/suppliers" element={<SuppliersPage />} />
      <Route path="/products/stock" element={<StockPage />} />
    </PortalApp>
  );
}
