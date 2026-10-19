import { MockedProvider } from '@apollo/client/testing/react';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { CampaignScheduleForm } from './campaign-schedule.form';

const mount = (canSend = true) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <NotificationProvider>
        <ConfirmProvider>
          <main>
            <CampaignScheduleForm
              campaignId="campaign-1"
              audienceListId="audience-1"
              eligible={1200}
              canSend={canSend}
              beforeQueue={cy.stub().as('beforeQueue').resolves(undefined)}
              onQueued={cy.stub().as('queued')}
            />
          </main>
        </ConfirmProvider>
      </NotificationProvider>
    </MockedProvider>,
  );

describe('CampaignScheduleForm', () => {
  it('sends now by default, without a time to pick', () => {
    mount();
    cy.get('input[value="NOW"]').should('be.checked');
    cy.fieldLabel('Send at').should('not.exist');
    cy.contains('button', 'Send campaign').should('be.visible');
  });

  it('asks for a time when scheduling', () => {
    mount();
    cy.get('input[value="LATER"]').check();
    cy.fieldLabel('Send at').should('be.visible');
    cy.contains('button', 'Schedule campaign').click();
    cy.contains('Choose when to send').should('be.visible');
    cy.get('@beforeQueue').should('not.have.been.called');
  });

  it('confirms the exact count before sending, and backs out on Cancel', () => {
    mount();
    cy.contains('button', 'Send campaign').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('Send this campaign now?').should('be.visible');
      cy.contains('It will go to 1,200 unique email address(es) now.').should('be.visible');
      cy.contains('button', 'Cancel').click();
    });
    cy.get('[role="dialog"]').should('not.exist');
    cy.get('@beforeQueue').should('not.have.been.called');
    cy.get('@queued').should('not.have.been.called');
  });

  it('refuses to send while a check is failing', () => {
    mount(false);
    cy.get('[role="alert"]').should('contain', 'Fix the problems in the checks before sending.');
    cy.contains('button', 'Send campaign').click();
    cy.get('[role="dialog"]').should('not.exist');
    cy.get('@beforeQueue').should('not.have.been.called');
  });
});
