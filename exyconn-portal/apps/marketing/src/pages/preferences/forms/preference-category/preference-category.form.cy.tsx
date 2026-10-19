import { MockedProvider } from '@apollo/client/testing/react';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { CreatePreferenceCategoryDocument } from '@exyconn/shell/graphql/generated';
import { PreferenceCategoryForm } from './preference-category.form';

const CREATED = {
  request: {
    query: CreatePreferenceCategoryDocument,
    variables: { input: { name: 'Events', description: '', isActive: true, sortOrder: 2 } },
  },
  result: {
    data: { createPreferenceCategory: { __typename: 'PreferenceCategory', id: 'cat-1' } },
  },
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[CREATED]}>
      <NotificationProvider>
        <main>
          <PreferenceCategoryForm
            initial={null}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </main>
      </NotificationProvider>
    </MockedProvider>,
  );

describe('PreferenceCategoryForm', () => {
  it('needs a name', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Name the category').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('keeps the order between 0 and 999', () => {
    mount();
    cy.get('input[name="name"]').type('Events');
    cy.get('input[type="number"]').type('{selectall}1000');
    cy.contains('button', 'Create').click();
    cy.contains('Use 999 or less').should('be.visible');
  });

  it('creates an offered category', () => {
    mount();
    cy.contains('Lower numbers are listed first.').should('be.visible');
    cy.get('input[name="name"]').type('Events');
    cy.get('input[type="number"]').type('{selectall}2');
    cy.contains('button', 'Create').click();
    cy.contains('Category created').should('be.visible');
    cy.get('@done').should('have.been.calledOnce');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
