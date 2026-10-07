import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SocialMediaPostStatus, SocialNetwork } from '@exyconn/shell/graphql/generated';
import { SocialPostForm } from '../../../../../../src/pages/social/forms/social-post';
import { renderWithProviders } from '../../../../test-utils';
import { postRow } from '../../../../fixtures';
import { chooseMany, chooseOption, fill, optionsOf, press } from '../../../../form-helpers';
import { ACCOUNTS, RULES } from './social-post.fixtures';

const gql = vi.hoisted(() => ({ compose: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useComposeSocialMediaPostMutation: () => [gql.compose],
  useUpdateSocialMediaPostMutation: () => [gql.update],
}));
vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) => {
  const stubs = await import('../../../../rhf-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/form/rhf')>()),
    RhfImageField: stubs.RhfValueStub,
    RhfDateTimePicker: stubs.RhfValueStub,
  };
});

function renderComposer(accounts = ACCOUNTS) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <SocialPostForm
      accounts={accounts}
      rules={RULES}
      initial={null}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );
  return { onDone, onCancel };
}

async function writeToFacebook(text: string) {
  await chooseMany('Post to', ['Acme · Facebook']);
  fill('Text', text);
}

describe('SocialPostForm — a new post', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.compose.mockResolvedValue({ data: { composeSocialMediaPost: [postRow()] } });
  });

  it('offers only the accounts whose network takes posts from here', async () => {
    renderComposer();

    expect(await optionsOf('Post to')).toEqual(['Acme · Facebook', 'Acme IG · Instagram']);
    expect(await optionsOf('When')).toEqual([
      'Publish now',
      'Schedule for later',
      'Save as a draft',
    ]);
  });

  it('says to connect an account first when none takes posts', () => {
    renderComposer([ACCOUNTS[2]]);

    expect(
      screen.getByText('Connect an account that takes posts first (Accounts tab).'),
    ).toBeInTheDocument();
    expect(screen.getByText('Pick accounts to see each network’s limit.')).toBeInTheDocument();
  });

  it('asks for an account and for something to post', async () => {
    renderComposer();

    await press('Post');

    expect(await screen.findByText('Choose at least one account')).toBeInTheDocument();
    expect(screen.getByText('Write something, or add an image')).toBeInTheDocument();
    expect(gql.compose).not.toHaveBeenCalled();
  });

  it("counts against each chosen network's limit and shows its notes", async () => {
    renderComposer();

    await chooseMany('Post to', ['Acme · Facebook', 'Acme IG · Instagram']);
    fill('Text', 'Hello');

    expect(screen.getByText('Facebook 5/63206 · Instagram 5/2200')).toBeInTheDocument();
    expect(screen.getByText('Facebook takes links and images.')).toBeInTheDocument();
  });

  it('publishes now to the chosen accounts', async () => {
    const { onDone } = renderComposer();
    await writeToFacebook('Hello');
    fill('Link', 'https://exyconn.com');

    await press('Post');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.compose).toHaveBeenCalledWith({
      variables: {
        input: {
          text: 'Hello',
          mediaUrl: '',
          link: 'https://exyconn.com',
          scheduledAt: null,
          accountIds: ['fb-1'],
          draft: false,
        },
      },
    });
    expect(await screen.findByText('Posted')).toBeInTheDocument();
  });

  it('saves a draft that does not go out', async () => {
    const { onDone } = renderComposer();
    await writeToFacebook('Later');
    await chooseOption('When', 'Save as a draft');

    await press('Post');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.compose.mock.calls[0][0].variables.input).toMatchObject({
      draft: true,
      scheduledAt: null,
    });
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it("reports each network's own refusal", async () => {
    gql.compose.mockResolvedValue({
      data: {
        composeSocialMediaPost: [
          postRow({ status: SocialMediaPostStatus.Published }),
          postRow({
            network: SocialNetwork.Instagram,
            status: SocialMediaPostStatus.Failed,
            error: 'Needs an image',
          }),
          postRow({
            network: SocialNetwork.X,
            status: SocialMediaPostStatus.Failed,
            error: 'Too long',
          }),
        ],
      },
    });
    const { onDone } = renderComposer();
    await writeToFacebook('Hello');

    await press('Post');

    expect(await screen.findByText('Instagram: Needs an image X: Too long')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it.each([
    [new Error('Rate limited'), 'Rate limited'],
    [null, 'Could not save the post'],
  ])('keeps the post when saving fails (%s)', async (failure, message) => {
    gql.compose.mockRejectedValue(failure);
    const { onDone } = renderComposer();
    await writeToFacebook('Hello');

    await press('Post');

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('treats an empty answer as nothing failed', async () => {
    gql.compose.mockResolvedValue({ data: null });
    renderComposer();
    await writeToFacebook('Hello');

    await press('Post');

    expect(await screen.findByText('Posted')).toBeInTheDocument();
  });

  it('hands cancel back to the page', async () => {
    const { onCancel } = renderComposer();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
