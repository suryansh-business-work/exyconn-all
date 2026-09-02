import { MockedProvider } from '@apollo/client/testing';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { AnnouncementForm } from './announcement.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <AnnouncementForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AnnouncementForm', () => {
  it('validates the required fields', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Title is required').should('be.visible');
    cy.contains('Message is required').should('be.visible');
  });

  it('rejects an expiry that lands before the publish date', () => {
    mount();
    cy.get('input[name="title"]').type('Diwali holiday');
    cy.get('textarea[name="body"]').first().type('Office closed.');
    cy.get('input[name="expiresAt"]').clear().type('01/01/2000');
    cy.contains('button', 'Create').click();
    cy.contains('Expiry must be after the publish date').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
