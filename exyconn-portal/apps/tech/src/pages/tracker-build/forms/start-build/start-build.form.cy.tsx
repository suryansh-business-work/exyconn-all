import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { StartBuildForm } from './start-build.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <StartBuildForm channelCount={2} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('StartBuildForm', () => {
  it('refuses a build that would produce no installer', () => {
    mount();
    cy.contains('button', 'Start build').click();
    cy.contains('Choose at least one installer to build').should('be.visible');
  });

  it('starts from a default branch rather than an empty one', () => {
    mount();
    cy.get('input[name="ref"]').should('not.have.value', '');
  });

  it('requires a branch to build from', () => {
    mount();
    cy.get('input[name="ref"]').clear();
    cy.contains('button', 'Start build').click();
    cy.contains('Branch is required').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
