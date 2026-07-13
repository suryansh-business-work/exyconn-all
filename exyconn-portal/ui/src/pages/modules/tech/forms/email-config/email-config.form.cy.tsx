import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { EmailConfigForm } from './email-config.form';
import { NotificationProvider } from '../../../../../components/feedback/NotificationProvider';
import { theme } from '../../../../../config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <EmailConfigForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('EmailConfigForm', () => {
  it('requires the key SMTP fields', () => {
    mount();
    cy.get('input[name="host"]').clear();
    cy.contains('button', 'Create').click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('Host is required').should('be.visible');
    cy.contains('Username is required').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
