import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { NotesForm } from './notes.form';

const NOTES = {
  version: 3,
  content: {
    overview: 'We reviewed the launch.',
    executiveSummary: 'On track.',
    agenda: ['Status'],
    discussionPoints: [],
    risks: [],
    blockers: [],
    openQuestions: [],
    followUps: [],
    nextTopics: [],
  },
};

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
          <NotesForm
            meetingId="meeting-1"
            notes={NOTES}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
            onReload={cy.stub().as('reload')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('NotesForm', () => {
  it('edits each list one item per line', () => {
    mount();
    cy.get('textarea[name="agenda"]').should('have.value', 'Status');
    cy.contains('One item per line').should('be.visible');
  });

  it('caps a list at 10,000 characters', () => {
    mount();
    fill('textarea[name="risks"]', 'x'.repeat(10_001));
    cy.contains('button', 'Save notes').click();
    cy.contains('Keep this list under 10,000 characters').should('be.visible');
  });

  it('explains a refused save and offers to reload the newer version', () => {
    mount();
    cy.contains('button', 'Save notes').click();
    cy.contains('button', 'Reload notes').click();
    cy.get('@reload').should('have.been.called');
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
