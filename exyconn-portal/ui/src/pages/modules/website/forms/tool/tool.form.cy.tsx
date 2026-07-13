import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { ToolForm } from './tool.form';
import { CreateToolDocument, ListToolCategoriesDocument } from '../../../../../graphql/generated';
import { NotificationProvider } from '../../../../../components/feedback/NotificationProvider';
import { theme } from '../../../../../config/theme';

const CATEGORY = { slug: 'ai-writing', category: 'AI Writing' };
const NEW_TOOL = { toolCode: 'TL-001', name: 'Headline Generator' };

/** The dynamic category select is populated from this query, not a hardcoded list. */
const categoriesMock: MockedResponse = {
  request: { query: ListToolCategoriesDocument },
  result: {
    data: {
      listToolCategories: [
        {
          id: 'cat-1',
          slug: CATEGORY.slug,
          category: CATEGORY.category,
          description: '',
          icon: '',
          color: '',
          isActive: true,
          order: 0,
        },
      ],
    },
  },
};

/** Exactly what ToolForm submits when only the required fields are filled in. */
const createMock: MockedResponse = {
  request: {
    query: CreateToolDocument,
    variables: {
      input: {
        toolCode: NEW_TOOL.toolCode,
        categorySlug: CATEGORY.slug,
        name: NEW_TOOL.name,
        description: '',
        longDescription: '',
        url: '',
        icon: '',
        color: '',
        features: [],
        useCases: [],
        keywords: [],
        isActive: true,
        isMVP: false,
        order: 0,
      },
    },
  },
  result: { data: { createTool: { id: 'tool-1' } } },
};

const mount = (mocks: MockedResponse[]) =>
  cy.mount(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ToolForm
            initial={null}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ToolForm', () => {
  it('validates the required tool code, category and name', () => {
    mount([categoriesMock]);
    cy.contains('button', 'Create').click();
    cy.contains('Tool code is required').should('be.visible');
    cy.contains('Category is required').should('be.visible');
    cy.contains('Name is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('submits a new tool with a category loaded from the categories query', () => {
    mount([categoriesMock, createMock]);
    cy.get('input[name="toolCode"]').type(NEW_TOOL.toolCode);
    cy.get('#mui-component-select-categorySlug').click();
    cy.get(`li[data-value="${CATEGORY.slug}"]`).click();
    cy.get('input[name="name"]').type(NEW_TOOL.name);
    cy.contains('button', 'Create').click();
    cy.contains('Tool created').should('be.visible');
    cy.get('@done').should('have.been.called');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount([categoriesMock]);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
