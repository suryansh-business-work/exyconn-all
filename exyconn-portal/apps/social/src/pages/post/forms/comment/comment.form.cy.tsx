import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { CreateSocialCommentDocument } from '@exyconn/shell/graphql/generated';
import { CommentForm } from './comment.form';
import { MAX_COMMENT_LENGTH } from './comment.schema';

const POST_ID = 'post-1';

const COMMENTED = {
  request: {
    query: CreateSocialCommentDocument,
    variables: { postId: POST_ID, body: 'Congratulations!' },
  },
  result: {
    data: {
      createSocialComment: {
        __typename: 'SocialComment',
        id: 'comment-1',
        postId: POST_ID,
        body: 'Congratulations!',
        createdAt: '2026-09-09T09:05:00.000Z',
        canDelete: true,
        author: {
          __typename: 'SocialAuthor',
          id: 'user-2',
          name: 'Asha Nair',
          email: 'asha@exyconn.com',
          avatarUrl: null,
          designation: 'Designer',
          department: 'Design',
        },
      },
    },
  },
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[COMMENTED]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <CommentForm postId={POST_ID} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('CommentForm', () => {
  it('will not post an empty comment', () => {
    mount();
    cy.contains('button', 'Comment').click();
    cy.contains('Write something before you comment').should('be.visible');
  });

  it('will not post whitespace dressed up as a comment', () => {
    mount();
    cy.get('textarea[name="body"]').type('   ');
    cy.contains('button', 'Comment').click();
    cy.contains('Write something before you comment').should('be.visible');
  });

  it('rejects a comment longer than the thread accepts', () => {
    mount();
    cy.get('textarea[name="body"]')
      .invoke('val', 'x'.repeat(MAX_COMMENT_LENGTH + 1))
      .trigger('input');
    cy.contains('button', 'Comment').click();
    cy.contains(`Keep a comment under ${MAX_COMMENT_LENGTH} characters`).should('be.visible');
  });

  it('clears the box once the comment is posted', () => {
    mount();
    cy.get('textarea[name="body"]').type('Congratulations!');
    cy.contains('button', 'Comment').click();
    cy.get('textarea[name="body"]').should('have.value', '');
  });
});
