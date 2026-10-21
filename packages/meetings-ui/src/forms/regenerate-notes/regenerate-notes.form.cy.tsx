import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { MaSummaryStyle } from '@exyconn/shell/graphql/generated';
import { RegenerateNotesForm } from './regenerate-notes.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <RegenerateNotesForm
            meetingId="meeting-1"
            style={MaSummaryStyle.Detailed}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('RegenerateNotesForm', () => {
  it('starts from the current style and offers every style', () => {
    mount();
    cy.get('input[name="style"]').should('have.value', 'DETAILED');
    cy.get('[role="combobox"]').click();
    cy.contains('[role="option"]', 'Project Review').click();
    cy.get('input[name="style"]').should('have.value', 'PROJECT_REVIEW');
  });

  it('stays open when the server refuses', () => {
    mount();
    cy.contains('button', 'Regenerate').click();
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
