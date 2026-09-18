import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { IncidentForm } from './incident.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <IncidentForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('IncidentForm', () => {
  it('requires a title and a description', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Give the incident a title').should('be.visible');
    cy.contains('Describe what is happening').should('be.visible');
  });

  it('adds a post-incident action that needs saying what to do', () => {
    mount();
    cy.contains('button', 'Add action').click();
    cy.contains('button', 'Create').click();
    cy.contains('Say what has to be done').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
