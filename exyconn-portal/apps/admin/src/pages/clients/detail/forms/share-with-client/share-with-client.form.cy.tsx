import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ClientShareOptionsDocument, ClientSharedKind } from '@exyconn/shell/graphql/generated';
import { ShareWithClientForm } from './share-with-client.form';

const options = (kind: ClientSharedKind, title: string) => ({
  request: { query: ClientShareOptionsDocument, variables: { kind } },
  result: {
    data: {
      clientShareOptions: [
        { __typename: 'ClientShareOption', id: `${kind}-1`, title, status: 'FINAL' },
      ],
    },
  },
});

const mount = () =>
  cy.mount(
    <MockedProvider
      mocks={[
        options(ClientSharedKind.Contract, 'Acme MSA'),
        options(ClientSharedKind.Document, 'Security overview'),
      ]}
    >
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ShareWithClientForm
            clientId="client-1"
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ShareWithClientForm', () => {
  it('requires a record', () => {
    mount();
    cy.contains('button', 'Share').click();
    cy.contains('Pick what to share').should('be.visible');
  });

  it('offers the records of the kind picked', () => {
    mount();
    cy.get('input[name="refId"]').click();
    cy.contains('[role="option"]', 'Acme MSA (FINAL)').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('[role="combobox"]').first().click();
    cy.contains('[role="option"]', 'Document').click();
    cy.get('input[name="refId"]').click();
    cy.contains('[role="option"]', 'Security overview (FINAL)').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
