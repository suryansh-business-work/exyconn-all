import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { SendInvoiceForm } from './send-invoice.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { GetClientDocument } from '@exyconn/shell/graphql/generated';

const invoice = {
  id: 'inv-1',
  number: 'INV-007',
  clientId: 'client-1',
  clientName: 'Priya',
  lines: [],
  amount: 2860,
  currency: 'INR',
  status: 'DRAFT',
  issuedDate: '',
  dueDate: '',
  sentAt: null,
  amountPaid: 0,
  balanceDue: 2860,
} as never;

const clientMock = {
  request: { query: GetClientDocument, variables: { id: 'client-1' } },
  result: {
    data: {
      getClient: { id: 'client-1', name: 'Priya', email: 'priya@acme.test', company: 'Acme' },
    },
  },
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[clientMock]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SendInvoiceForm invoice={invoice} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SendInvoiceForm', () => {
  it('prefills the recipient from the client on file', () => {
    mount();
    cy.get('input[name="email"]').should('have.value', 'priya@acme.test');
  });

  it('validates the recipient email', () => {
    mount();
    cy.get('input[name="email"]').clear().type('not-an-email');
    cy.contains('button', 'Send').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
