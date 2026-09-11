import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { theme } from '@exyconn/shell/config/theme';
import { TrackerNoticeForm } from './tracker-notice.form';

const EMPLOYEES = [
  { value: 'u1', label: 'Asha Rao' },
  { value: 'u2', label: 'Dev Mehta' },
];

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ConfirmProvider>
            <TrackerNoticeForm employees={EMPLOYEES} />
          </ConfirmProvider>
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('TrackerNoticeForm', () => {
  it('says who an empty recipient list actually reaches', () => {
    mount();
    // The one thing an administrator must not have to guess: an empty field here means
    // everybody, not nobody.
    cy.contains('every employee with tracker access').should('exist');
  });

  it('refuses a notice with no title', () => {
    mount();
    cy.get('textarea[name="body"]').first().type('Friday is a holiday.');
    cy.contains('button', 'Send notice').click();

    cy.contains('A notice needs a title').should('exist');
  });

  it('refuses a notice with nothing to say', () => {
    mount();
    cy.get('input[name="title"]').type('Office closed');
    cy.contains('button', 'Send notice').click();

    cy.contains('A notice needs something to say').should('exist');
  });

  it('rejects a title longer than the portal accepts', () => {
    mount();
    cy.get('input[name="title"]').type('x'.repeat(121));
    cy.get('textarea[name="body"]').first().type('Something.');
    cy.contains('button', 'Send notice').click();

    cy.contains('Keep the title under 120 characters').should('exist');
  });

  it('asks before sending, because a notice cannot be recalled', () => {
    mount();
    cy.get('input[name="title"]').type('Office closed');
    cy.get('textarea[name="body"]').first().type('Friday is a holiday.');
    cy.contains('button', 'Send notice').click();

    cy.contains('Send this notice?').should('exist');
    cy.contains('It cannot be recalled').should('exist');
  });
});
