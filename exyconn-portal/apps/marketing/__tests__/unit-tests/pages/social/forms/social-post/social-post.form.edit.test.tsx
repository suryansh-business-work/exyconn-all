import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SocialMediaPostStatus } from '@exyconn/shell/graphql/generated';
import {
  SocialPostForm,
  type ScheduleDefaults,
  type SocialMediaPostRow,
} from '../../../../../../src/pages/social/forms/social-post';
import { renderWithProviders } from '../../../../test-utils';
import { postRow } from '../../../../fixtures';
import { chooseOption, fill, optionsOf, press } from '../../../../form-helpers';
import { ACCOUNTS, FUTURE, RULES } from './social-post.fixtures';

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

function renderForm(initial: SocialMediaPostRow | null, schedule?: ScheduleDefaults) {
  const onDone = vi.fn();
  renderWithProviders(
    <SocialPostForm
      accounts={ACCOUNTS}
      rules={RULES}
      initial={initial}
      schedule={schedule}
      onDone={onDone}
      onCancel={vi.fn()}
    />,
  );
  return { onDone };
}

describe('SocialPostForm — planned and stored posts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.compose.mockResolvedValue({ data: { composeSocialMediaPost: [postRow()] } });
    gql.update.mockResolvedValue({ data: { updateSocialMediaPost: postRow() } });
  });

  it('schedules a post planned on the calendar, dropping accounts that take no posts', () => {
    renderForm(null, { accountIds: ['fb-1', 'li-ro'], scheduledAt: FUTURE });

    expect(screen.getByLabelText('Publish at')).toHaveValue(FUTURE);
    expect(screen.getByText('Facebook 0/63206')).toBeInTheDocument();
    expect(screen.getByText('Facebook takes links and images.')).toBeInTheDocument();
    expect(screen.queryByText('LinkedIn is read only here.')).not.toBeInTheDocument();
  });

  it('hides the time once the post is to go out now instead', async () => {
    renderForm(null, { accountIds: ['fb-1'], scheduledAt: FUTURE });

    await chooseOption('When', 'Publish now');

    expect(screen.queryByLabelText('Publish at')).not.toBeInTheDocument();
  });

  it('sends a planned post at its time once it has words', async () => {
    const { onDone } = renderForm(null, { accountIds: ['fb-1'], scheduledAt: FUTURE });
    fill('Text', 'Autumn launch');

    await press('Post');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.compose.mock.calls[0][0].variables.input).toEqual({
      text: 'Autumn launch',
      mediaUrl: '',
      link: '',
      scheduledAt: FUTURE,
      accountIds: ['fb-1'],
      draft: false,
    });
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('edits a stored post on its own account, offering only later or draft', async () => {
    const post = postRow({ id: 'post-5', scheduledAt: FUTURE });
    const { onDone } = renderForm(post);

    expect(screen.queryByRole('combobox', { name: /^Post to/ })).not.toBeInTheDocument();
    expect(await optionsOf('When')).toEqual(['Schedule for later', 'Save as a draft']);
    await press('Save');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'post-5',
        input: { text: 'Our autumn launch', mediaUrl: '', link: '', scheduledAt: FUTURE },
      },
    });
    expect(gql.compose).not.toHaveBeenCalled();
    expect(await screen.findByText('Post updated')).toBeInTheDocument();
  });

  it('keeps a stored draft unscheduled', async () => {
    const { onDone } = renderForm(
      postRow({ status: SocialMediaPostStatus.Draft, scheduledAt: null }),
    );

    await press('Save');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input.scheduledAt).toBeNull();
  });

  it('shows no limit for a network without rules, and no notes', () => {
    renderForm(postRow({ accountId: 'yt-1' }));

    expect(screen.getByText('YouTube 17/–')).toBeInTheDocument();
    expect(screen.queryByText('Facebook takes links and images.')).not.toBeInTheDocument();
  });

  it('asks for accounts to show limits when the account is no longer connected', () => {
    renderForm(postRow({ accountId: 'gone' }));

    expect(screen.getByText('Pick accounts to see each network’s limit.')).toBeInTheDocument();
  });

  it('keeps the edit open when the update fails', async () => {
    gql.update.mockRejectedValue(new Error('Post already published'));
    const { onDone } = renderForm(postRow({ scheduledAt: FUTURE }));

    await press('Save');

    expect(await screen.findByText('Post already published')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
