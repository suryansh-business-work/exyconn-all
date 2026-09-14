import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ObjectiveForm } from './objective.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <ObjectiveForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ObjectiveForm', () => {
  it('asks what the objective is, who owns it and how it is measured', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Say what the objective is').should('be.visible');
    cy.contains('An objective needs an owner').should('be.visible');
    cy.contains('Say how it is measured').should('be.visible');
  });

  it('refuses a target that asks for no movement', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('The target has to differ from the baseline').should('be.visible');
  });

  it('says how far the current value has come once a target is set', () => {
    mount();
    cy.get('input[name="target"]').clear().type('10');
    cy.get('input[name="actual"]').clear().type('5');
    cy.contains('50% of the way from 0 to 10').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
