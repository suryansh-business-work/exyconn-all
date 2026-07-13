import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { SignContractForm } from './sign-contract.form';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';

const contract = {
  id: '1',
  title: 'Service Agreement',
  party: 'Acme Inc',
  type: 'MSA',
  effectiveDate: '',
  expiryDate: '',
  status: 'DRAFT',
  sentAt: null,
  signedBy: null,
  signedAt: null,
} as never;

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <SignContractForm
            contract={contract}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SignContractForm', () => {
  it('requires a signer name', () => {
    mount();
    cy.contains('button', 'Sign').click();
    cy.contains('Signer name is required').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
