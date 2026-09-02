import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { CaseStudyForm } from './case-study.form';
import { CreateCaseStudyDocument } from '@exyconn/shell/graphql/generated';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const NEW_STUDY = { slug: 'acme-migration', title: 'Acme Migration' };

/** Exactly what CaseStudyForm submits when only the required fields are filled in. */
const createMock: MockedResponse = {
  request: {
    query: CreateCaseStudyDocument,
    variables: {
      input: {
        slug: NEW_STUDY.slug,
        title: NEW_STUDY.title,
        excerpt: '',
        content: '',
        coverImage: '',
        category: '',
        author: '',
        tags: [],
        pdfUrl: '',
        featured: false,
        isActive: true,
        publishedAt: null,
      },
    },
  },
  result: { data: { createCaseStudy: { id: 'study-1' } } },
};

const mount = (mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <CaseStudyForm
            initial={null}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('CaseStudyForm', () => {
  it('validates the required slug and title', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Slug is required').should('be.visible');
    cy.contains('Title is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('submits a new case study and calls onDone', () => {
    mount([createMock]);
    cy.get('input[name="slug"]').type(NEW_STUDY.slug);
    cy.get('input[name="title"]').type(NEW_STUDY.title);
    cy.contains('button', 'Create').click();
    cy.contains('Case study created').should('be.visible');
    cy.get('@done').should('have.been.called');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
