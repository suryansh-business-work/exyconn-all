import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { UpdateEmailConfigDocument } from '@exyconn/shell/graphql/generated';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { EmailConfigForm } from './email-config.form';
import type { EmailConfigRow } from './email-config.types';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

/** A stored config as the list returns it: the secret itself is never in it. */
const stored: EmailConfigRow = {
  id: 'c1',
  label: 'Primary',
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  username: 'mailer',
  hasPassword: true,
  fromAddress: 'no-reply@example.com',
  isActive: true,
};

/** Saving the stored config untouched sends a blank secret, which the server reads as "keep". */
const keepSecretMock: MockedResponse = {
  request: {
    query: UpdateEmailConfigDocument,
    variables: {
      id: 'c1',
      input: {
        label: 'Primary',
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        username: 'mailer',
        password: '',
        fromAddress: 'no-reply@example.com',
        isActive: true,
      },
    },
  },
  result: { data: { updateEmailConfig: { id: 'c1' } } },
};

const mount = (initial: EmailConfigRow | null = null, mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <EmailConfigForm
            initial={initial}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('EmailConfigForm', () => {
  it('requires the key SMTP fields', () => {
    mount();
    cy.get('input[name="host"]').clear();
    cy.contains('button', 'Create').click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('Host is required').should('be.visible');
    cy.contains('Username is required').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });

  it('never prefills the stored secret and keeps it when left blank', () => {
    mount(stored, [keepSecretMock]);
    cy.get('input[name="password"]').should('have.value', '');
    cy.contains('Leave blank to keep the current value').should('be.visible');
    cy.contains('button', 'Update').click();
    cy.get('@done').should('have.been.called');
  });
});
