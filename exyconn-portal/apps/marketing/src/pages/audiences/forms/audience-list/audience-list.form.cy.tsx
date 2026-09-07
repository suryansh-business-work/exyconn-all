import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { AudienceListForm } from './audience-list.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <AudienceListForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AudienceListForm', () => {
  it('requires a name and somebody to send to', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Pick some people, or choose a segment rule').should('be.visible');
  });

  it('says when there are no clients or contacts to pick from', () => {
    mount();
    cy.contains('No clients found — add clients first.').should('be.visible');
    cy.contains('No contacts found — add contacts first.').should('be.visible');
  });

  it('asks for the account status only once that segment rule is chosen', () => {
    mount();
    cy.contains('label', 'Account status').should('not.exist');
    cy.contains('label', 'Segment rule').click();
    cy.contains('li', 'Contacts By Company Status').click();
    cy.contains('label', 'Account status').should('be.visible');
  });

  it('accepts a segment rule instead of naming anybody', () => {
    mount();
    cy.contains('label', 'Segment rule').click();
    cy.contains('li', 'All Active Contacts').click();
    cy.contains('button', 'Create').click();
    cy.contains('Pick some people, or choose a segment rule').should('not.exist');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
