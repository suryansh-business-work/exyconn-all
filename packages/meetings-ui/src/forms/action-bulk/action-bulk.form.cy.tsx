import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ActionBulkForm } from './action-bulk.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ActionBulkForm
            ids={['a', 'b']}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ActionBulkForm', () => {
  it('says how many are selected and needs something to set', () => {
    mount();
    cy.contains('2 selected').should('be.visible');
    cy.contains('button', 'Apply to selected').click();
    cy.contains('Pick a status or a priority to set').should('be.visible');
  });

  it('stays open when the server refuses', () => {
    mount();
    cy.get('[role="combobox"]').first().click();
    cy.contains('[role="option"]', 'Completed').click();
    cy.contains('button', 'Apply to selected').click();
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
