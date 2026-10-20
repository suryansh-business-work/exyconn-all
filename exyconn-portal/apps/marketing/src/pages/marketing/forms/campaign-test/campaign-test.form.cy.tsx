import { MockedProvider } from '@apollo/client/testing/react';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { SendCampaignTestDocument } from '@exyconn/shell/graphql/generated';
import { CampaignTestForm } from './campaign-test.form';

const SENT = {
  request: {
    query: SendCampaignTestDocument,
    variables: { id: 'campaign-1', to: 'ravi@exyconn.com', recordKind: null, recordId: null },
  },
  result: { data: { sendCampaignTest: true } },
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[SENT]}>
      <NotificationProvider>
        <main>
          <CampaignTestForm
            campaignId="campaign-1"
            record={null}
            beforeSend={cy.stub().as('beforeSend').resolves(undefined)}
          />
        </main>
      </NotificationProvider>
    </MockedProvider>,
  );

describe('CampaignTestForm', () => {
  it('needs an address', () => {
    mount();
    cy.contains('button', 'Send test email').click();
    cy.contains('Enter the address to send the test to').should('be.visible');
    cy.get('@beforeSend').should('not.have.been.called');
  });

  it('rejects a malformed address', () => {
    mount();
    cy.get('input[name="to"]').type('not-an-email');
    cy.contains('button', 'Send test email').click();
    cy.contains('Enter a valid email address').should('be.visible');
  });

  it('saves the draft and sends the test', () => {
    mount();
    cy.contains('Personalised with sample data.').should('be.visible');
    cy.get('input[name="to"]').type('ravi@exyconn.com');
    cy.contains('button', 'Send test email').click();
    cy.get('@beforeSend').should('have.been.calledOnce');
    cy.contains('Test email sent to ravi@exyconn.com').should('be.visible');
  });

  it('clears the address on Cancel', () => {
    mount();
    cy.get('input[name="to"]').type('ravi@exyconn.com');
    cy.contains('button', 'Cancel').click();
    cy.get('input[name="to"]').should('have.value', '');
  });
});
