import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { ProductsOverviewPage, ProductsPage } from './pages/products';

/** Products micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.PRODUCTS} homePath="/products">
      <Route path="/products" element={<ProductsOverviewPage />} />
      <Route path="/products/catalogue" element={<ProductsPage />} />
    </PortalApp>
  );
}
