import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ReviewForm } from './review.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <ReviewForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ReviewForm', () => {
  it('asks what the review is and which standards it covers', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name the review').should('be.visible');
    cy.contains('Pick at least one standard').should('be.visible');
  });

  it('will not minute a review that says neither what was considered nor decided', () => {
    mount();
    cy.get('input[name="status"]').parent().click();
    cy.contains('li', 'Minuted').click();
    cy.contains('button', 'Create').click();
    cy.contains('A minuted review has to say what was considered and what was decided').should(
      'be.visible',
    );
  });

  it('collects the actions the meeting agreed', () => {
    mount();
    cy.contains('button', 'Add action').click();
    cy.get('input[name="actions.0.description"]').type('Rewrite the procedure');
    cy.get('input[name="actions.0.ownerName"]').type('Asha');
    cy.contains('button', 'Create').click();
    cy.contains('Say what the action is').should('not.exist');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
