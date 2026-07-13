import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { BlogPostForm } from './blog-post.form';
import { CreateBlogPostDocument } from '../../../../../graphql/generated';
import { NotificationProvider } from '../../../../../components/feedback/NotificationProvider';
import { theme } from '../../../../../config/theme';

const NEW_POST = { slug: 'scaling-graphql', title: 'Scaling GraphQL', author: 'Ada Lovelace' };

/** Exactly what BlogPostForm submits when only the required fields are filled in. */
const createMock: MockedResponse = {
  request: {
    query: CreateBlogPostDocument,
    variables: {
      input: {
        slug: NEW_POST.slug,
        title: NEW_POST.title,
        summary: '',
        content: '',
        author: { name: NEW_POST.author, role: '', initials: '' },
        readTime: '',
        tags: [],
        coverImage: '',
        featured: false,
        isActive: true,
        publishedAt: null,
      },
    },
  },
  result: { data: { createBlogPost: { id: 'post-1' } } },
};

const mount = (mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <BlogPostForm
            initial={null}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('BlogPostForm', () => {
  it('validates the required slug, title and author name', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Slug is required').should('be.visible');
    cy.contains('Title is required').should('be.visible');
    cy.contains('Author name is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('submits a new blog post and calls onDone', () => {
    mount([createMock]);
    cy.get('input[name="slug"]').type(NEW_POST.slug);
    cy.get('input[name="title"]').type(NEW_POST.title);
    cy.get('input[name="author.name"]').type(NEW_POST.author);
    cy.contains('button', 'Create').click();
    cy.contains('Blog post created').should('be.visible');
    cy.get('@done').should('have.been.called');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
