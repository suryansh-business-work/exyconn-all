import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { CreateSocialPostDocument } from '@exyconn/shell/graphql/generated';
import { PostForm } from './post.form';
import { MAX_POST_LENGTH } from './post.schema';

const POSTED = {
  request: {
    query: CreateSocialPostDocument,
    variables: { input: { body: 'Ship day 🎉', imageUrl: '' } },
  },
  result: {
    data: {
      createSocialPost: {
        __typename: 'SocialPost',
        id: 'post-1',
        body: 'Ship day 🎉',
        imageUrl: '',
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        likedByMe: false,
        canDelete: true,
        createdAt: '2026-09-09T09:00:00.000Z',
        author: {
          __typename: 'SocialAuthor',
          id: 'user-1',
          name: 'Ravi Kumar',
          email: 'ravi@exyconn.com',
          avatarUrl: null,
          designation: 'Engineer',
          department: 'Tech',
        },
        sharedFrom: null,
      },
    },
  },
};

const mount = (onPosted = cy.stub()) =>
  cy.mount(
    <MockedProvider mocks={[POSTED]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <PostForm onPosted={onPosted} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

/**
 * Sets a textarea's value the way React sees it.
 *
 * `.invoke('val')` writes straight to the DOM node, but React overrides the value
 * setter and tracks the previous value, so the synthetic input event never fires and
 * React Hook Form keeps the old (empty) value. Calling the prototype setter first is
 * what makes React notice — and it is far quicker than typing thousands of characters.
 */
const paste = (selector: string, text: string) => {
  cy.get(selector).then(($el) => {
    const node = $el[0] as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(
      globalThis.HTMLTextAreaElement.prototype,
      'value',
    )?.set;
    setter?.call(node, text);
    node.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

describe('PostForm', () => {
  it('will not publish an empty post', () => {
    mount();
    cy.contains('button', 'Post').click();
    cy.contains('Write something before you post').should('be.visible');
  });

  it('will not publish whitespace dressed up as a post', () => {
    mount();
    cy.get('textarea[name="body"]').type('    ');
    cy.contains('button', 'Post').click();
    cy.contains('Write something before you post').should('be.visible');
  });

  it('rejects a post longer than the feed accepts', () => {
    mount();
    paste('textarea[name="body"]', 'x'.repeat(MAX_POST_LENGTH + 1));
    cy.contains('button', 'Post').click();
    cy.contains(`Keep a post under ${MAX_POST_LENGTH} characters`).should('be.visible');
  });

  it('publishes a post and clears the composer for the next one', () => {
    const onPosted = cy.stub().as('onPosted');
    mount(onPosted);
    cy.get('textarea[name="body"]').type('Ship day 🎉');
    cy.contains('button', 'Post').click();
    cy.get('@onPosted').should('have.been.called');
    cy.get('textarea[name="body"]').should('have.value', '');
  });

  it('puts the composer back the way it was when the draft is discarded', () => {
    mount();
    cy.get('textarea[name="body"]').type('Never mind');
    cy.contains('button', 'Cancel').click();
    cy.get('textarea[name="body"]').should('have.value', '');
  });
});
