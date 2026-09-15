import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { UpdateImageConfigDocument } from '@exyconn/shell/graphql/generated';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { ImageConfigForm } from './image-config.form';
import type { ImageConfigRow } from './image-config.types';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

/** A stored config as the list returns it: the secret itself is never in it. */
const stored: ImageConfigRow = {
  id: 'c1',
  label: 'Primary',
  provider: 'imagekit',
  publicKey: 'public_abc',
  hasPrivateKey: true,
  privateKeyHint: 'wxyz',
  urlEndpoint: 'https://ik.imagekit.io/demo',
  isActive: true,
};

/** Saving the stored config untouched sends a blank secret, which the server reads as "keep". */
const keepSecretMock: MockedResponse = {
  request: {
    query: UpdateImageConfigDocument,
    variables: {
      id: 'c1',
      input: {
        label: 'Primary',
        provider: 'imagekit',
        publicKey: 'public_abc',
        privateKey: '',
        urlEndpoint: 'https://ik.imagekit.io/demo',
        isActive: true,
      },
    },
  },
  result: { data: { updateImageConfig: { id: 'c1' } } },
};

const mount = (initial: ImageConfigRow | null = null, mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ImageConfigForm
            initial={initial}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ImageConfigForm', () => {
  it('requires the provider credentials', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('Public key is required').should('be.visible');
    cy.contains('Private key is required').should('be.visible');
  });

  // RHF validates on submit, so typing alone shows nothing until the first submit.
  it('validates the URL endpoint', () => {
    mount();
    cy.get('input[name="urlEndpoint"]').type('not-a-url');
    cy.contains('button', 'Create').click();
    cy.contains('Enter a valid URL').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });

  it('never prefills the stored secret and keeps it when left blank', () => {
    mount(stored, [keepSecretMock]);
    cy.get('input[name="privateKey"]').should('have.value', '');
    cy.contains('Leave blank to keep the current value').should('be.visible');
    cy.contains('button', 'Update').click();
    cy.get('@done').should('have.been.called');
  });
});
