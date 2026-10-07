import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MockLink } from '@apollo/client/testing';
import { UpdateProfileDocument } from '@/graphql/generated';
import { AvatarUploader } from '@/pages/Profile/AvatarUploader';
import { makeUser, renderWithProviders } from '../../test-utils';
import { answer, failure } from '../../mockResult';
import { me } from './meFixture';

const NEW_PHOTO = 'https://ik.example.com/avatars/new.png';

/** Lets one test make the notifier itself fail; every other test uses the real one. */
const notifyOverride: { fn: ((...args: unknown[]) => void) | null } = { fn: null };

vi.mock('@/components/feedback/NotificationProvider', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/components/feedback/NotificationProvider')>();
  return {
    ...actual,
    useNotify: () => {
      const real = actual.useNotify();
      return notifyOverride.fn ?? real;
    },
  };
});

/** The upload dialog talks to ImageKit; this stand-in hands back an uploaded address. */
vi.mock('@/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui')>();
  return {
    ...actual,
    ImageUploadDialog: ({
      open,
      title,
      currentUrl,
      onClose,
      onUploaded,
    }: Readonly<{
      open: boolean;
      title: string;
      currentUrl?: string | null;
      onClose: () => void;
      onUploaded: (url: string) => void;
    }>) =>
      open ? (
        <div role="dialog" aria-label={title} data-current={currentUrl ?? ''}>
          <button type="button" onClick={() => onUploaded(NEW_PHOTO)}>
            Finish upload
          </button>
          <button type="button" onClick={onClose}>
            Close upload
          </button>
        </div>
      ) : null,
  };
});

const saved = () =>
  answer(
    UpdateProfileDocument,
    { updateProfile: me({ avatarUrl: NEW_PHOTO }) },
    { input: { avatarUrl: NEW_PHOTO } },
  );

function showUploader(
  mocks: MockLink.MockedResponse[] = [],
  online = true,
  user: ReturnType<typeof makeUser> | null = makeUser({
    avatarUrl: 'https://ik.example.com/old.png',
  }),
) {
  renderWithProviders(<AvatarUploader online={online} />, { mocks, user });
}

async function upload() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Change photo' }));
  await user.click(screen.getByRole('button', { name: 'Finish upload' }));
}

afterEach(() => {
  notifyOverride.fn = null;
  vi.restoreAllMocks();
});

describe('the avatar uploader', () => {
  it('shows the photo and says the person is online', () => {
    showUploader();

    expect(screen.getByRole('img', { name: 'Asha Rao' })).toHaveAttribute(
      'src',
      'https://ik.example.com/old.png',
    );
    expect(screen.getByLabelText('Online')).toBeInTheDocument();
  });

  it('shows initials and offline for somebody with no photo who is away', () => {
    showUploader([], false, makeUser({ name: 'Ravi Kumar' }));

    expect(screen.getByText('RK')).toBeInTheDocument();
    expect(screen.getByLabelText('Offline')).toBeInTheDocument();
  });

  it('draws an empty avatar for nobody signed in', async () => {
    const user = userEvent.setup();
    showUploader([], true, null);

    await user.click(screen.getByRole('button', { name: 'Change photo' }));

    expect(screen.getByRole('dialog', { name: 'Profile photo' })).toHaveAttribute(
      'data-current',
      '',
    );
  });

  it('opens the upload dialog on the current photo and closes it untouched', async () => {
    const user = userEvent.setup();
    showUploader();

    await user.click(screen.getByRole('button', { name: 'Change photo' }));
    expect(screen.getByRole('dialog', { name: 'Profile photo' })).toHaveAttribute(
      'data-current',
      'https://ik.example.com/old.png',
    );

    await user.click(screen.getByRole('button', { name: 'Close upload' }));
    expect(screen.queryByRole('dialog', { name: 'Profile photo' })).not.toBeInTheDocument();
  });

  it('saves an uploaded photo at once and shows it', async () => {
    const save = saved();
    showUploader([save.mock]);

    await upload();

    expect(await screen.findByText('Profile photo updated')).toBeInTheDocument();
    expect(save.delivered()).toBe(true);
    expect(screen.getByRole('img', { name: 'Asha Rao' })).toHaveAttribute('src', NEW_PHOTO);
    expect(screen.queryByRole('dialog', { name: 'Profile photo' })).not.toBeInTheDocument();
  });

  it('says why the photo could not be saved, and keeps the old one', async () => {
    showUploader([
      failure(UpdateProfileDocument, { input: { avatarUrl: NEW_PHOTO } }, 'Too large'),
    ]);

    await upload();

    expect(await screen.findByText('Too large')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Asha Rao' })).toHaveAttribute(
      'src',
      'https://ik.example.com/old.png',
    );
  });

  it('logs rather than leaving an unhandled rejection when even the warning fails', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken = new Error('The notifier is gone');
    notifyOverride.fn = () => {
      throw broken;
    };
    showUploader([failure(UpdateProfileDocument, { input: { avatarUrl: NEW_PHOTO } })]);

    await upload();

    await waitFor(() => expect(logged).toHaveBeenCalledWith('Saving the photo failed', broken));
  });
});
