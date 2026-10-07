import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { LeaveBalanceCards } from '../../../../src/pages/employee/LeaveBalanceCards';

const year = new Date().getFullYear();

const balance = (id: string, leaveTypeCode: string, balanceYear: number, available: number) => ({
  id,
  employeeId: 'e1',
  leaveTypeCode,
  year: balanceYear,
  allocated: available,
  carriedForward: 0,
  used: 2,
  adjustment: 0,
  available,
});

describe('LeaveBalanceCards', () => {
  it('shows one tile per leave type for this year, available out of available plus used', () => {
    renderWithProviders(
      <LeaveBalanceCards balances={[balance('b1', 'CL', year, 4), balance('b2', 'SL', year, 6)]} />,
    );
    expect(screen.getByText('CL left')).toBeInTheDocument();
    expect(screen.getByText('4 of 6 days')).toBeInTheDocument();
    expect(screen.getByText('SL left')).toBeInTheDocument();
    expect(screen.getByText('6 of 8 days')).toBeInTheDocument();
  });

  it("leaves out other years' balances", () => {
    renderWithProviders(
      <LeaveBalanceCards
        balances={[balance('b1', 'CL', year, 4), balance('b0', 'EL', year - 1, 9)]}
      />,
    );
    expect(screen.getByText('CL left')).toBeInTheDocument();
    expect(screen.queryByText('EL left')).toBeNull();
  });

  it('holds four placeholder tiles while the first balances load', () => {
    const { container } = renderWithProviders(<LeaveBalanceCards balances={[]} loading />);
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy).not.toBeNull();
    expect(busy?.querySelectorAll('.MuiSkeleton-root')).toHaveLength(4);
  });

  it('keeps showing the tiles it has while a reload is in flight', () => {
    const { container } = renderWithProviders(
      <LeaveBalanceCards balances={[balance('b1', 'CL', year, 4)]} loading />,
    );
    expect(screen.getByText('CL left')).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('renders nothing once loaded when HR has allocated nothing this year', () => {
    const { container } = renderWithProviders(
      <LeaveBalanceCards balances={[balance('b0', 'EL', year - 1, 9)]} />,
    );
    expect(screen.queryByText(/left$/)).toBeNull();
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(container.querySelector('.MuiGrid-root')).toBeNull();
  });
});
