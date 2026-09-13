import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { FindingForm } from './finding.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <FindingForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('FindingForm', () => {
  it('asks what was found and who owns putting it right', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Say what was found').should('be.visible');
    cy.contains('Somebody has to own putting it right').should('be.visible');
  });

  it('will not close a finding nobody has verified', () => {
    mount();
    cy.get('input[name="status"]').parent().click();
    cy.contains('li', 'Closed').click();
    cy.contains('button', 'Create').click();
    cy.contains('A finding closes once its corrective action has been verified').should(
      'be.visible',
    );
  });

  it('keeps "not checked yet" apart from "it did not work"', () => {
    mount();
    cy.get('input[name="effective"]').parent().click();
    cy.contains('li', 'Not checked yet').should('be.visible');
    cy.contains('li', 'No — it did not').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
