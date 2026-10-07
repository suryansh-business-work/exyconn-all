import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialFeedDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { PostForm } from '../../../../../../src/pages/feed/forms/post';

const api = vi.hoisted(() => ({
  create: vi.fn<(options: unknown) => Promise<unknown>>(),
  hookOptions: vi.fn<(options: unknown) => void>(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useCreateSocialPostMutation: (options: unknown) => {
      api.hookOptions(options);
      return [api.create];
    },
  };
});

const LABEL = 'Share something with the company';
const snackbar = () => document.querySelector('.MuiSnackbar-root');
const bodyField = () => screen.getByRole('textbox', { name: LABEL });

beforeEach(() => {
  api.create.mockReset().mockResolvedValue({ data: { createSocialPost: { id: 'post-9' } } });
  api.hookOptions.mockReset();
});

describe('PostForm', () => {
  it('explains the limit and who can see a post, and refetches the feed after posting', () => {
    renderWithProviders(<PostForm />);
    expect(
      screen.getByText('Up to 5000 characters. Everyone signed in can see this.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Photo')).toBeInTheDocument();
    expect(api.hookOptions).toHaveBeenCalledWith({ refetchQueries: [SocialFeedDocument] });
  });

  it('refuses an empty post and sends nothing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PostForm />);
    await user.click(screen.getByRole('button', { name: 'Post' }));
    expect(await screen.findByText('Write something before you post')).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('refuses a post of nothing but spaces', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PostForm />);
    await user.type(bodyField(), '   ');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    expect(await screen.findByText('Write something before you post')).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('publishes the trimmed text, clears the composer and tells the page', async () => {
    const user = userEvent.setup();
    const onPosted = vi.fn();
    renderWithProviders(<PostForm onPosted={onPosted} />);
    await user.type(bodyField(), '  Hello team  ');
    await user.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        variables: { input: { body: 'Hello team', imageUrl: '' } },
      }),
    );
    await waitFor(() => expect(snackbar()).toHaveTextContent('Posted to the feed'));
    expect(bodyField()).toHaveValue('');
    expect(onPosted).toHaveBeenCalledTimes(1);
  });

  it('publishes without a page listening for it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PostForm />);
    await user.type(bodyField(), 'Lunch at one');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Posted to the feed'));
    expect(bodyField()).toHaveValue('');
  });

  it('keeps the draft and reports why when publishing fails', async () => {
    api.create.mockRejectedValue(new Error('Feed is read-only'));
    const user = userEvent.setup();
    const onPosted = vi.fn();
    renderWithProviders(<PostForm onPosted={onPosted} />);
    await user.type(bodyField(), 'Hello team');
    await user.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => expect(snackbar()).toHaveTextContent('Feed is read-only'));
    expect(bodyField()).toHaveValue('Hello team');
    expect(onPosted).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when publishing fails without an Error', async () => {
    api.create.mockRejectedValue('offline');
    const user = userEvent.setup();
    renderWithProviders(<PostForm />);
    await user.type(bodyField(), 'Hello team');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    await waitFor(() => expect(snackbar()).toHaveTextContent('Could not publish that post'));
  });

  it('throws the draft away on cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PostForm />);
    await user.type(bodyField(), 'Never mind');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(bodyField()).toHaveValue('');
    expect(api.create).not.toHaveBeenCalled();
  });
});
