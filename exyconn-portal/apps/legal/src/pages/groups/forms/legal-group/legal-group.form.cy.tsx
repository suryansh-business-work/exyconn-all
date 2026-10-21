import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { CreateLegalGroupDocument, LegalItemKind } from '@exyconn/shell/graphql/generated';
import { LegalGroupForm } from './legal-group.form';

const created = {
  request: {
    query: CreateLegalGroupDocument,
    variables: {
      input: { name: 'Part Time Employee Contracts', description: '', kind: 'CONTRACT' },
    },
  },
  result: {
    data: {
      createLegalGroup: {
        __typename: 'LegalGroup',
        id: 'g1',
        name: 'Part Time Employee Contracts',
        kind: 'CONTRACT',
        description: '',
      },
    },
  },
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[created]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <LegalGroupForm
            kind={LegalItemKind.Contract}
            initial={null}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('LegalGroupForm', () => {
  it('requires a name of at least 2 characters', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name is required').should('be.visible');
    cy.get('input[name="name"]').type('P');
    cy.contains('Minimum 2 characters').should('be.visible');
  });

  it('creates a group for the register it was opened from', () => {
    mount();
    cy.get('input[name="name"]').type('Part Time Employee Contracts');
    cy.contains('button', 'Create').click();
    cy.get('@done').should('have.been.calledOnce');
  });

  it('cancels', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.calledOnce');
  });
});
