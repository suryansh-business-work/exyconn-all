import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { BlockUserForm } from './block-user.form';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <BlockUserForm userId="u1" onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('BlockUserForm', () => {
  it('validates the reason field', () => {
    mount();
    cy.contains('button', 'Block').click();
    cy.contains('A reason is required').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
