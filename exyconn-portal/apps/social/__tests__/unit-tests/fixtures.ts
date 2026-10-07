import type {
  SocialAuthorFieldsFragment,
  SocialCommentFieldsFragment,
  SocialPostFieldsFragment,
  SocialProfileQuery,
} from '@exyconn/shell/graphql/generated';

/** A colleague as the feed bylines them. */
export function author(
  overrides: Partial<SocialAuthorFieldsFragment> = {},
): SocialAuthorFieldsFragment {
  return {
    __typename: 'SocialAuthor',
    id: 'user-1',
    name: 'Asha Rao',
    email: 'asha@example.com',
    avatarUrl: null,
    designation: 'Engineer',
    department: 'Platform',
    ...overrides,
  };
}

/** A post on the feed, nobody's like on it yet, not deletable by the reader. */
export function post(overrides: Partial<SocialPostFieldsFragment> = {}): SocialPostFieldsFragment {
  return {
    __typename: 'SocialPost',
    id: 'post-1',
    body: 'Shipped the new payroll export today',
    imageUrl: '',
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    likedByMe: false,
    canDelete: false,
    createdAt: '2026-10-01T09:00:00.000Z',
    author: author(),
    sharedFrom: null,
    ...overrides,
  };
}

/** A comment under `post-1`. */
export function comment(
  overrides: Partial<SocialCommentFieldsFragment> = {},
): SocialCommentFieldsFragment {
  return {
    __typename: 'SocialComment',
    id: 'comment-1',
    postId: 'post-1',
    body: 'Nice work',
    createdAt: '2026-10-01T10:00:00.000Z',
    canDelete: false,
    author: author({ id: 'user-2', name: 'Ravi Kumar' }),
    ...overrides,
  };
}

type Profile = SocialProfileQuery['socialProfile'];

/** A colleague's profile with a few posts and likes to their name. */
export function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    __typename: 'SocialProfile',
    brief: 'Builds the payroll engine.',
    joinDate: '2024-04-01',
    postCount: 4,
    likesReceived: 12,
    user: author(),
    ...overrides,
  };
}
