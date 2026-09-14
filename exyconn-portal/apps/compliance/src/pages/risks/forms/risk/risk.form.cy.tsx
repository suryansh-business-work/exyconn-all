import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { RiskForm } from './risk.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <RiskForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('RiskForm', () => {
  it('asks what the risk is and who owns it', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Say what the risk is').should('be.visible');
    cy.contains('A risk with no owner is a note, not a risk').should('be.visible');
  });

  it('will not file a risk against no standard at all', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Pick at least one standard').should('be.visible');
  });

  it('shows the band each rating falls into as it is chosen', () => {
    mount();
    cy.contains('Inherent rating 9 — Medium').should('be.visible');
    cy.contains('Residual rating 4 — Low').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
