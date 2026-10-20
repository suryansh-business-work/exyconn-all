import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  RemoveMarketingSuppressionDocument,
  SuppressionReason,
} from '@exyconn/shell/graphql/generated';
import { RemoveSuppressionForm } from './remove-suppression.form';

const JUSTIFICATION = 'Re-subscribed on the website on 3 March';

const removed: MockLink.MockedResponse = {
  request: {
    query: RemoveMarketingSuppressionDocument,
    variables: { id: 'suppression-1', justification: JUSTIFICATION },
  },
  result: { data: { removeMarketingSuppression: true } },
};

const refused: MockLink.MockedResponse = {
  request: { query: RemoveMarketingSuppressionDocument, variables: () => true },
  error: new Error('Only an administrator can remove this'),
};

const mount = (mocks: MockLink.MockedResponse[] = [], reason = SuppressionReason.Manual) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <main>
            <RemoveSuppressionForm
              id="suppression-1"
              email="gone@acme.io"
              reason={reason}
              onDone={cy.stub().as('done')}
              onCancel={cy.stub().as('cancel')}
            />
          </main>
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

const answer = (confirmEmail: string) => {
  cy.get('textarea[name="justification"]').type(JUSTIFICATION);
  cy.get('input[name="confirmEmail"]').type(confirmEmail);
  cy.contains('button', 'Remove suppression').click();
};

describe('RemoveSuppressionForm', () => {
  it('says what removing means', () => {
    mount();
    cy.contains('Campaigns will be able to email gone@acme.io again.').should('be.visible');
    cy.contains('This person withdrew consent themselves.').should('not.exist');
  });

  it('warns when the person withdrew consent themselves', () => {
    mount([], SuppressionReason.Unsubscribed);
    cy.contains('This person withdrew consent themselves.').should('be.visible');
  });

  it('asks why before removing', () => {
    mount();
    cy.contains('button', 'Remove suppression').click();
    cy.contains('Say why in at least 10 characters').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('refuses an address typed back wrong', () => {
    mount();
    answer('other@acme.io');
    cy.contains('Type the address exactly to confirm').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('removes once the address is typed back', () => {
    mount([removed]);
    answer('GONE@acme.io');
    cy.get('@done').should('have.been.calledOnce');
    cy.contains('gone@acme.io removed from the suppression list').should('be.visible');
  });

  it('says why the server refused and stays open', () => {
    mount([refused], SuppressionReason.SpamComplaint);
    answer('gone@acme.io');
    cy.contains('Only an administrator can remove this').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
