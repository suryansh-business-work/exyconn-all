import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ConfirmSpeakerForm } from './confirm-speaker.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ConfirmSpeakerForm
            meetingId="meeting-1"
            label="Unknown Speaker 1"
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ConfirmSpeakerForm', () => {
  it('names the label being confirmed and requires a name', () => {
    mount();
    cy.contains('Every line labelled Unknown Speaker 1 will show this name.').should('be.visible');
    cy.contains('button', 'Confirm speaker').click();
    cy.contains('Name is required').should('be.visible');
    cy.get('input[name="name"]').type('x'.repeat(121), { delay: 0 }).blur();
    cy.contains('Keep the name under 120 characters').should('be.visible');
  });

  it('reports a refused save and stays open', () => {
    mount();
    cy.get('input[name="name"]').type('Ravi');
    cy.contains('button', 'Confirm speaker').click();
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
