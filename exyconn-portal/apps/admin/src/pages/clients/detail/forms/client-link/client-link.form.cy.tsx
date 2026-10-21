import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { CreateClientLinkDocument } from '@exyconn/shell/graphql/generated';
import { ClientLinkForm } from './client-link.form';

const INPUT = {
  title: 'Drive',
  url: 'https://drive.example/acme',
  description: '',
  details: '',
  notify: false,
};

const mount = (mocks = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ClientLinkForm
            clientId="client-1"
            initial={null}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ClientLinkForm', () => {
  it('requires a title and a full web address', () => {
    mount();
    cy.get('input[name="url"]').type('drive.example');
    cy.contains('button', 'Create').click();
    cy.contains('Give the link a title').should('be.visible');
    cy.contains('Enter a full address starting with http:// or https://').should('be.visible');
  });

  it('saves a link and hands back', () => {
    mount([
      {
        request: {
          query: CreateClientLinkDocument,
          variables: { clientId: 'client-1', input: INPUT },
        },
        result: {
          data: {
            createClientLink: {
              __typename: 'ClientLink',
              id: 'link-1',
              clientId: 'client-1',
              ...INPUT,
              createdByName: 'Arjun',
              createdAt: '2026-10-01T00:00:00.000Z',
            },
          },
        },
      },
    ] as never);
    cy.get('input[name="title"]').type('Drive');
    cy.get('input[name="url"]').type('https://drive.example/acme');
    cy.contains('button', 'Create').click();
    cy.get('@done').should('have.been.calledOnce');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
