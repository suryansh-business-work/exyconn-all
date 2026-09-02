import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { CustomMailForm } from './custom-mail.form';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <CustomMailForm userId="u1" onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('CustomMailForm', () => {
  it('validates required fields', () => {
    mount();
    cy.contains('button', 'Send').click();
    cy.contains('Subject is required').should('be.visible');
    cy.contains('Message is required').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
