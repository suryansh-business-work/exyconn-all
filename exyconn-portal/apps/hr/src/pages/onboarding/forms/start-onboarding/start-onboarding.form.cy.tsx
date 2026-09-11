import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { StartOnboardingForm } from './start-onboarding.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <StartOnboardingForm onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('StartOnboardingForm', () => {
  it('requires both the employee and the template', () => {
    mount();
    cy.contains('button', 'Start onboarding').click();
    cy.contains('Choose the employee joining').should('be.visible');
    cy.contains('Choose a template').should('be.visible');
  });

  it('points HR at the templates page when there are none', () => {
    mount();
    cy.contains('Add a template in HR → Onboarding Templates first.').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
