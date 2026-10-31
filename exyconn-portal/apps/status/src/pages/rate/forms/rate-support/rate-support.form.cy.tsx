import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SubmitSupportCsatDocument } from '@exyconn/shell/graphql/generated';
import { RateSupportForm } from './rate-support.form';

const token = 'survey-token';

const rated = (score: number, comment: string): MockLink.MockedResponse => ({
  request: { query: SubmitSupportCsatDocument, variables: { token, score, comment } },
  result: { data: { submitSupportCsat: true } },
});

const alreadyAnswered: MockLink.MockedResponse = {
  request: { query: SubmitSupportCsatDocument, variables: { token, score: 2, comment: '' } },
  error: new Error('This survey link does not work, or it has already been answered.'),
};

const mount = (mocks: MockLink.MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <RateSupportForm
            token={token}
            onRated={cy.stub().as('rated')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('the public support satisfaction survey', () => {
  it('needs a rating before it will send', () => {
    mount();
    cy.contains('button', 'Send rating').click();

    cy.contains('Choose how happy you are with the help you got').should('be.visible');
    cy.get('@rated').should('not.have.been.called');
  });

  it('refuses a comment longer than 1000 characters', () => {
    mount();
    cy.contains('label', '3 — Neutral').click();
    cy.get('textarea[name="comment"]').invoke('val', 'x'.repeat(1001)).type(' ');
    cy.contains('button', 'Send rating').click();

    cy.contains('Keep the comment under 1000 characters').should('be.visible');
  });

  it('sends the rating with the trimmed comment', () => {
    mount([rated(5, 'Fixed in minutes')]);
    cy.contains('label', '5 — Very happy').click();
    cy.get('textarea[name="comment"]').type('  Fixed in minutes  ');
    cy.contains('button', 'Send rating').click();

    cy.get('@rated').should('have.been.calledOnce');
  });

  it('says why a used link was refused', () => {
    mount([alreadyAnswered]);
    cy.contains('label', '2 — Unhappy').click();
    cy.contains('button', 'Send rating').click();

    cy.contains('already been answered').should('be.visible');
    cy.get('@rated').should('not.have.been.called');
  });

  it('leaves without rating', () => {
    mount();
    cy.contains('button', 'Cancel').click();

    cy.get('@cancel').should('have.been.calledOnce');
  });
});
