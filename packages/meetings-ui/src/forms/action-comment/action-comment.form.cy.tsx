import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ActionCommentForm } from './action-comment.form';

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
        <NotificationProvider>
          <ActionCommentForm actionId="action-1" onDone={cy.stub().as('done')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ActionCommentForm', () => {
  it('requires a comment and caps its length', () => {
    mount();
    cy.contains('button', 'Add comment').click();
    cy.contains('Write a comment first').should('be.visible');
    fill('textarea[name="text"]', 'x'.repeat(2001));
    cy.contains('Keep the comment under 2,000 characters').should('be.visible');
  });

  it('keeps the comment when the server refuses it, and clears it on Cancel', () => {
    mount();
    cy.get('textarea[name="text"]').type('On it');
    cy.contains('button', 'Add comment').click();
    cy.get('@done').should('not.have.been.called');
    cy.get('textarea[name="text"]').should('have.value', 'On it');
    cy.contains('button', 'Cancel').click();
    cy.get('textarea[name="text"]').should('have.value', '');
  });
});
