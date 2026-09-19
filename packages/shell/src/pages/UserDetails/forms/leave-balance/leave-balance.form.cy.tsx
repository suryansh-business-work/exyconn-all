import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@/components/ui/styles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';
import { LeaveBalanceForm } from './leave-balance.form';
import type { LeaveBalanceRow } from './leave-balance.types';

const HELD: LeaveBalanceRow = {
  __typename: 'LeaveBalance',
  id: 'b1',
  employeeId: 'e1',
  leaveTypeCode: 'CL',
  year: 2026,
  allocated: 12,
  carriedForward: 2,
  used: 4,
  adjustment: 0,
  available: 10,
};

const mount = (initial: LeaveBalanceRow | null) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <LeaveBalanceForm
            employeeId="e1"
            year={2026}
            initial={initial}
            typeOptions={[{ value: 'SL', label: 'Sick leave (SL)' }]}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('LeaveBalanceForm', () => {
  it('asks which leave type to add', () => {
    mount(null);
    cy.contains('button', 'Create').click();
    cy.contains('Choose a leave type').should('be.visible');
  });

  it('shows the type being adjusted and what will be available', () => {
    mount(HELD);
    cy.contains('CL for 2026').should('be.visible');
    cy.contains('Available after saving: 10 days').should('be.visible');
  });

  it('adds and takes away days through the adjustment', () => {
    mount(HELD);
    cy.get('input[name="adjustment"]').clear();
    cy.get('input[name="adjustment"]').type('3');
    cy.contains('Available after saving: 13 days').should('be.visible');
    cy.get('input[name="adjustment"]').clear();
    cy.get('input[name="adjustment"]').type('-2');
    cy.contains('Available after saving: 8 days').should('be.visible');
  });

  it('refuses to leave fewer than 0 days', () => {
    mount(HELD);
    cy.get('input[name="adjustment"]').clear();
    cy.get('input[name="adjustment"]').type('-11');
    cy.contains('button', 'Update').click();
    cy.contains('This would leave fewer than 0 days available').should('be.visible');
  });

  it('calls onCancel', () => {
    mount(null);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
