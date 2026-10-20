import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { theme } from '@exyconn/shell/config/theme';
import { AudienceListForm } from './audience-list.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ConfirmProvider>
            <AudienceListForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
          </ConfirmProvider>
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AudienceListForm', () => {
  it('requires a name', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
  });

  it('starts from the recommended set-up: both registers, one preferred address, kept live', () => {
    mount();
    cy.contains('button', 'Both').should('have.attr', 'aria-pressed', 'true');
    cy.get('input[name="emailSelection"][value="PRIMARY"]').should('be.checked');
    cy.get('input[name="updateMode"][value="DYNAMIC"]').should('be.checked');
  });

  it('asks where company addresses come from only when companies are a source', () => {
    mount();
    cy.contains('Company email sources').should('be.visible');
    cy.contains('button', 'Contacts').click();
    cy.contains('Company email sources').should('not.exist');
  });

  it('warns that using every address can reach one person several times', () => {
    mount();
    cy.get('input[name="emailSelection"][value="ALL"]').check({ force: true });
    cy.contains('in several of their inboxes').should('be.visible');
  });

  it('needs picked records when only picked records are used', () => {
    mount();
    cy.get('input[name="name"]').type('VIPs');
    cy.contains('button', 'Picked records only').click();
    cy.contains('button', 'Create').click();
    cy.contains('Pick some records, or choose Contacts, Companies or Both').should('be.visible');
  });

  it('explains that a fixed snapshot is frozen when saved', () => {
    mount();
    cy.get('input[name="updateMode"][value="FIXED_SNAPSHOT"]').check({ force: true });
    cy.contains('Saving freezes the audience exactly as the counts below show it.').should(
      'be.visible',
    );
  });

  it('keeps the final eligible count in view and offers a retry when it cannot be counted', () => {
    mount();
    cy.contains('Final eligible recipients').should('be.visible');
    // No server answers in this harness, so the counts fail and the panel says so.
    cy.contains('button', 'Retry').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
