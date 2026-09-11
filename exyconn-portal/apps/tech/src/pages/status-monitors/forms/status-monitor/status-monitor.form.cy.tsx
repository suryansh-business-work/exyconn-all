import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { StatusMonitorForm } from './status-monitor.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <StatusMonitorForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('StatusMonitorForm', () => {
  it('requires a key, a name and a URL', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Key is required').should('be.visible');
    cy.contains('Name is required').should('be.visible');
    cy.contains('URL is required').should('be.visible');
  });

  it('keeps the key to a stable lower-case identifier', () => {
    mount();
    cy.get('input[name="key"]').type('Tools API');
    cy.contains('button', 'Create').click();
    cy.contains('Use lower-case letters, digits and hyphens only').should('be.visible');
  });

  it('demands a full URL, not a bare hostname', () => {
    mount();
    cy.get('input[name="key"]').type('tools-api');
    cy.get('input[name="name"]').type('Tools API');
    cy.get('input[name="url"]').type('tools.example.com/health');
    cy.contains('button', 'Create').click();
    cy.contains('Enter the full URL, starting with https://').should('be.visible');
  });

  it('accepts a full https URL', () => {
    mount();
    cy.get('input[name="key"]').type('tools-api');
    cy.get('input[name="name"]').type('Tools API');
    cy.get('input[name="url"]').type('https://tools.example.com/health');
    cy.contains('button', 'Create').click();
    cy.contains('Enter the full URL, starting with https://').should('not.exist');
  });

  it('refuses a negative display order', () => {
    mount();
    cy.get('input[name="order"]').clear().type('-1');
    cy.contains('button', 'Create').click();
    cy.contains('Order cannot be negative').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
