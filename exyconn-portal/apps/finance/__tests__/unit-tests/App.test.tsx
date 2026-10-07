import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import {
  FinanceOverviewPage,
  FinancePage,
  FinancePeriodPicker,
  RecurringInvoicesPage,
  financePeriods,
  periodFor,
} from '../../src/pages/finance';
import { ExpensesPage } from '../../src/pages/expenses';
import { PaymentsPage } from '../../src/pages/payments';
import { ReceivablesPage } from '../../src/pages/receivables';
import { CompanyExpensesPage } from '../../src/pages/company-expenses';
import { CostCentersPage } from '../../src/pages/cost-centers';
import { BudgetsPage } from '../../src/pages/budgets';
import { BudgetVariancePage } from '../../src/pages/budget-variance';
import { ChangeLogPage } from '../../src/pages/change-log';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

const portal = vi.hoisted(() => ({ props: null as null | PortalProps }));

/** The real PortalApp builds an Apollo client and an AuthProvider; the stand-in records its props. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalProps>) => {
    portal.props = props;
    return null;
  },
}));

interface RouteProps {
  path: string;
  element: ReactElement;
}

function routes(): RouteProps[] {
  return Children.toArray(portal.props?.children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);
}

describe('App', () => {
  it('mounts the shell for the FINANCE module, homed at /finance, signing in with Login', () => {
    render(<App />);

    expect(portal.props?.moduleRole).toBe(ROLES.FINANCE);
    expect(portal.props?.homePath).toBe('/finance');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('puts the overview at home and every finance screen on its own route', () => {
    render(<App />);

    expect(routes().map((route) => [route.path, route.element.type])).toEqual([
      ['/finance', FinanceOverviewPage],
      ['/finance/invoices', FinancePage],
      ['/finance/recurring', RecurringInvoicesPage],
      ['/finance/payments', PaymentsPage],
      ['/finance/receivables', ReceivablesPage],
      ['/finance/company-expenses', CompanyExpensesPage],
      ['/finance/cost-centres', CostCentersPage],
      ['/finance/budgets', BudgetsPage],
      ['/finance/budget-variance', BudgetVariancePage],
      ['/finance/change-log', ChangeLogPage],
      ['/expenses', ExpensesPage],
    ]);
  });

  it('exposes the period helpers and picker from the finance entry point', () => {
    expect(typeof FinancePeriodPicker).toBe('function');
    expect(periodFor('last-6').key).toBe('last-6');
    expect(financePeriods().map((period) => period.key)).toEqual([
      'this-month',
      'last-3',
      'last-6',
      'last-12',
    ]);
  });
});
