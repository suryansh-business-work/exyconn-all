import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  RejectVendorInvoiceDocument,
  VendorInvoiceStatus,
  VendorPaymentStatus,
} from '@exyconn/shell/graphql/generated';
import { RejectVendorInvoiceForm } from './reject-vendor-invoice.form';
import type { VendorInvoiceRow } from './reject-vendor-invoice.types';

const invoice: VendorInvoiceRow = {
  __typename: 'VendorInvoice',
  id: 'vinv-1',
  supplierId: 'supplier-1',
  supplierName: 'Acme Supplies',
  purchaseOrderId: 'po-1',
  purchaseOrderNumber: 'PO-0007',
  invoiceNumber: 'INV-42',
  invoiceDate: '2026-10-20T00:00:00.000Z',
  dueDate: '2026-11-19T00:00:00.000Z',
  amount: 1250,
  currency: 'USD',
  notes: '',
  fileUrl: 'https://cdn.example.test/inv-42.pdf',
  fileName: 'inv-42.pdf',
  status: VendorInvoiceStatus.Submitted,
  submittedBy: 'Sam <sam@acme.test>',
  reviewedBy: '',
  reviewedAt: null,
  reviewNote: '',
  paymentStatus: VendorPaymentStatus.NotBilled,
  paidOn: null,
  createdAt: '2026-10-20T08:00:00.000Z',
};

const rejected = (reason: string): MockLink.MockedResponse => ({
  request: { query: RejectVendorInvoiceDocument, variables: { id: 'vinv-1', reason } },
  result: {
    data: {
      rejectVendorInvoice: {
        ...invoice,
        status: VendorInvoiceStatus.Rejected,
        reviewNote: reason,
      },
    },
  },
});

const refused: MockLink.MockedResponse = {
  request: { query: RejectVendorInvoiceDocument, variables: { id: 'vinv-1', reason: 'Late' } },
  error: new Error('Only an invoice waiting for review can be rejected.'),
};

const mount = (mocks: MockLink.MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <RejectVendorInvoiceForm
            invoice={invoice}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('RejectVendorInvoiceForm', () => {
  it('requires a reason, and a blank one counts as none', () => {
    mount();
    cy.get('textarea[name="reason"]').type('   ');
    cy.contains('button', 'Reject invoice').click();
    cy.contains('Say why the invoice is rejected').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('caps the reason at 1000 characters', () => {
    mount();
    cy.get('textarea[name="reason"]').type('x'.repeat(1001), { delay: 0 });
    cy.contains('button', 'Reject invoice').click();
    cy.contains('Keep the reason under 1000 characters').should('be.visible');
  });

  it('sends the invoice back with the trimmed reason', () => {
    mount([rejected('Tax charged twice')]);
    cy.get('textarea[name="reason"]').type('  Tax charged twice  ');
    cy.contains('button', 'Reject invoice').click();
    cy.contains('Invoice INV-42 sent back').should('be.visible');
    cy.get('@done').should('have.been.calledOnce');
  });

  it('shows the server refusal and stays open', () => {
    mount([refused]);
    cy.get('textarea[name="reason"]').type('Late');
    cy.contains('button', 'Reject invoice').click();
    cy.contains('Only an invoice waiting for review can be rejected.').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('cancels without sending anything', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.calledOnce');
  });
});
