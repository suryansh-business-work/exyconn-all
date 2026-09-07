import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { ApproveClaimForm } from './approve-claim.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const claim = {
  id: 'claim-1',
  employeeId: 'emp-1',
  category: 'Travel',
  description: 'Client visit',
  amount: 3000,
  currency: 'INR',
  incurredOn: '2026-09-12',
  receiptUrl: null,
  status: 'SUBMITTED',
  approvedAmount: null,
} as never;

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ApproveClaimForm claim={claim} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ApproveClaimForm', () => {
  it('defaults the approved amount to what was claimed', () => {
    mount();
    cy.get('input[name="approvedAmount"]').should('have.value', '3000');
  });

  it('refuses to approve more than was claimed', () => {
    mount();
    cy.get('input[name="approvedAmount"]').clear().type('9000');
    cy.contains('button', 'Approve').click();
    cy.contains('Cannot exceed the 3000 claimed').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
