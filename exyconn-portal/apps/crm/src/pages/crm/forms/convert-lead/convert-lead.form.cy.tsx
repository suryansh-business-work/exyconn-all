import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ConvertLeadForm } from './convert-lead.form';
import type { ConvertLeadTarget } from './convert-lead.types';

const lead = {
  id: 'lead-1',
  name: 'Ravi Kumar',
  email: 'ravi@acme.com',
  source: 'WEBSITE',
  stage: 'QUALIFIED',
  value: 50000,
  owner: 'Asha Rao',
  notes: '',
  convertedDealId: null,
} as unknown as ConvertLeadTarget;

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ConvertLeadForm lead={lead} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ConvertLeadForm', () => {
  it('prefills the contact and value from the lead', () => {
    mount();
    cy.get('input[name="contactName"]').should('have.value', 'Ravi Kumar');
    cy.get('input[name="contactEmail"]').should('have.value', 'ravi@acme.com');
    cy.get('input[name="value"]').should('have.value', '50000');
  });

  it('requires a company and validates the contact email', () => {
    mount();
    cy.get('input[name="contactEmail"]').clear().type('bad');
    cy.contains('button', 'Convert').click();
    cy.contains('Company is required').should('be.visible');
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
