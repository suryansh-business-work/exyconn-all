import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { UpdateMarketingSuppressionNoteDocument } from '@exyconn/shell/graphql/generated';
import { SuppressionNoteForm } from './suppression-note.form';

const saved: MockLink.MockedResponse = {
  request: {
    query: UpdateMarketingSuppressionNoteDocument,
    variables: { id: 'suppression-1', note: 'Legal hold until 2027' },
  },
  result: {
    data: {
      updateMarketingSuppressionNote: {
        __typename: 'MarketingSuppression',
        id: 'suppression-1',
        note: 'Legal hold until 2027',
      },
    },
  },
};

const failed: MockLink.MockedResponse = {
  request: { query: UpdateMarketingSuppressionNoteDocument, variables: () => true },
  error: new Error('Suppression not found'),
};

const mount = (mocks: MockLink.MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <main>
            <SuppressionNoteForm
              id="suppression-1"
              note="Asked by phone"
              onDone={cy.stub().as('done')}
              onCancel={cy.stub().as('cancel')}
            />
          </main>
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SuppressionNoteForm', () => {
  it('starts from the stored note and counts it', () => {
    mount();
    cy.get('textarea[name="note"]').should('have.value', 'Asked by phone');
    cy.contains('Visible to the marketing team only. 14/500').should('be.visible');
  });

  it('stops the note at the limit', () => {
    mount();
    cy.get('textarea[name="note"]')
      .invoke('val', 'x'.repeat(498))
      .type('xxxxx')
      .should('have.value', 'x'.repeat(500));
    cy.contains('500/500').should('be.visible');
  });

  it('saves the note and closes', () => {
    mount([saved]);
    cy.get('textarea[name="note"]').clear().type('Legal hold until 2027');
    cy.contains('button', 'Save note').click();
    cy.get('@done').should('have.been.calledOnce');
    cy.contains('Note saved').should('be.visible');
  });

  it('says why the note could not be saved and stays open', () => {
    mount([failed]);
    cy.contains('button', 'Save note').click();
    cy.contains('Suppression not found').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
