import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { AuditForm } from './audit.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <AuditForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AuditForm', () => {
  it('asks what is audited, against what and by whom', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name the audit').should('be.visible');
    cy.contains('Say what is being audited').should('be.visible');
    cy.contains('Name the lead auditor').should('be.visible');
    cy.contains('Pick at least one standard').should('be.visible');
  });

  it('will not report an audit that never says it was carried out', () => {
    mount();
    cy.get('input[name="status"]').parent().click();
    cy.contains('li', 'Reported').click();
    cy.contains('button', 'Create').click();
    cy.contains('A reported audit has to say when it was carried out').should('be.visible');
    cy.contains('A reported audit has to say what it concluded').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
