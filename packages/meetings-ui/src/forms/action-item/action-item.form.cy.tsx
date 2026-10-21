import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ActionItemForm } from './action-item.form';

/** Puts a long value in a field the way typing would, without typing thousands of keys. */
const fill = (selector: string, value: string) =>
  cy.get(selector).then(($field) => {
    const field = $field[0] as HTMLTextAreaElement;
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(
      field,
      value,
    );
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <ActionItemForm
              initial={null}
              meetingId="meeting-1"
              onDone={cy.stub().as('done')}
              onCancel={cy.stub().as('cancel')}
            />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ActionItemForm', () => {
  it('requires a title and caps the text fields', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Title is required').should('be.visible');
    fill('textarea[name="description"]', 'x'.repeat(5001));
    cy.contains('Keep the description under 5,000 characters').should('be.visible');
  });

  it('starts pending at medium priority', () => {
    mount();
    cy.get('input[name="priority"]').should('have.value', 'MEDIUM');
    cy.get('input[name="status"]').should('have.value', 'PENDING');
  });

  it('stays open when the server refuses the item', () => {
    mount();
    cy.get('input[name="title"]').type('Send the proposal');
    cy.contains('button', 'Create').click();
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
