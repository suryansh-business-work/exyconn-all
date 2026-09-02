import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { ToolCategoryForm } from './tool-category.form';
import { CreateToolCategoryDocument } from '@exyconn/shell/graphql/generated';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const NEW_CATEGORY = { slug: 'ai-writing', category: 'AI Writing' };

/** Exactly what ToolCategoryForm submits when only the required fields are filled in. */
const createMock = {
  request: {
    query: CreateToolCategoryDocument,
    variables: {
      input: {
        slug: NEW_CATEGORY.slug,
        category: NEW_CATEGORY.category,
        description: '',
        icon: '',
        color: '',
        isActive: true,
        order: 0,
      },
    },
  },
  result: { data: { createToolCategory: { id: 'cat-1' } } },
};

const mount = (mocks: (typeof createMock)[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ToolCategoryForm
            initial={null}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ToolCategoryForm', () => {
  it('validates the required slug and category', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Slug is required').should('be.visible');
    cy.contains('Category is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('submits a new tool category and calls onDone', () => {
    mount([createMock]);
    cy.get('input[name="slug"]').type(NEW_CATEGORY.slug);
    cy.get('input[name="category"]').type(NEW_CATEGORY.category);
    cy.contains('button', 'Create').click();
    cy.contains('Tool category created').should('be.visible');
    cy.get('@done').should('have.been.called');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
