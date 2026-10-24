import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { BuildRetentionForm } from './build-retention.form';

const mount = (keepLatestBuilds = 5) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <BuildRetentionForm keepLatestBuilds={keepLatestBuilds} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('BuildRetentionForm', () => {
  it('starts from the stored count', () => {
    mount(7);
    cy.get('input[name="keepLatestBuilds"]').should('have.value', '7');
  });

  it('refuses a negative count', () => {
    mount();
    cy.get('input[name="keepLatestBuilds"]').clear().type('-1');
    cy.contains('button', 'Save').click();
    cy.contains('Enter 0 or more').should('be.visible');
  });

  it('refuses more than it can keep', () => {
    mount();
    cy.get('input[name="keepLatestBuilds"]').clear().type('501');
    cy.contains('button', 'Save').click();
    cy.contains('Keep at most 500 builds').should('be.visible');
  });

  it('puts the stored count back on Cancel', () => {
    mount(3);
    cy.get('input[name="keepLatestBuilds"]').clear().type('9');
    cy.contains('button', 'Cancel').click();
    cy.get('input[name="keepLatestBuilds"]').should('have.value', '3');
  });
});
