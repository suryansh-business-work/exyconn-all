import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { DecisionForm } from './decision.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <DecisionForm
            onDecide={cy.stub().as('decide').resolves(true)}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('DecisionForm', () => {
  it('approves without a note', () => {
    mount();
    cy.contains('button', 'Record decision').click();
    cy.get('@decide').should('have.been.calledWith', { decision: 'APPROVED', note: '' });
    cy.get('@done').should('have.been.called');
  });

  it('asks why when rejecting', () => {
    mount();
    cy.get('[role="combobox"]').first().click();
    cy.contains('li', /rejected/i).click();
    cy.contains('button', 'Record decision').click();
    cy.contains('Say why it is being rejected').should('be.visible');
    cy.get('@decide').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
