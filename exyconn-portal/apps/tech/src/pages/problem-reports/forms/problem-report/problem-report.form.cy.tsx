import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { ProblemReportForm } from './problem-report.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ProblemReportForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ProblemReportForm', () => {
  it('requires a title, a description and a reporter', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Title is required').should('be.visible');
    cy.contains('Describe the problem — at least 20 characters').should('be.visible');
    cy.contains('Reporter name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
  });

  it('holds a logged report to the same description length as the public form', () => {
    mount();
    cy.get('input[name="subject"]').type('Portal is slow');
    cy.get('textarea[name="description"]').type('Too slow');
    cy.contains('button', 'Create').click();
    cy.contains('Describe the problem — at least 20 characters').should('be.visible');
  });

  it('rejects a malformed reporter email', () => {
    mount();
    cy.get('input[name="reporterEmail"]').type('not-an-email');
    cy.contains('button', 'Create').click();
    cy.contains('Enter a valid email').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
