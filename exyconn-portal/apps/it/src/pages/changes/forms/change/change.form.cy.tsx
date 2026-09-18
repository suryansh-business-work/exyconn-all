import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ChangeForm } from './change.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <ChangeForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ChangeForm', () => {
  it('requires a title, a system and a description', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Give the change a title').should('be.visible');
    cy.contains('Name the system being changed').should('be.visible');
    cy.contains('Describe what will change').should('be.visible');
  });

  it('asks for a rollback plan on a risky production change', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('needs a rollback plan').should('be.visible');
  });

  it('never offers approval from the form', () => {
    mount();
    cy.get('[role="combobox"]').eq(3).click();
    cy.contains('li', /^approved$/i).should('not.exist');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
