import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { MockLink } from '@apollo/client/testing';
import { UpdateProfileDocument } from '@/graphql/generated';
import { ProfileForm } from '@/pages/Profile/forms/profile';
import { makeUser, renderWithProviders } from '../../../../test-utils';
import { answer, failure } from '../../../../mockResult';
import { me, meAnswer } from '../../meFixture';

const SAVED_INPUT = {
  name: 'Asha R.',
  phone: '+91 98765 43210',
  brief: 'Builds the payroll engine.',
  socialLinks: {
    linkedin: 'https://www.linkedin.com/in/asha',
    github: '',
    twitter: '',
    website: '',
  },
  timezone: 'Asia/Kolkata',
  locale: 'en-IN',
};

function showForm(
  mocks: MockLink.MockedResponse[],
  user: ReturnType<typeof makeUser> | null = makeUser(),
) {
  renderWithProviders(<ProfileForm />, { mocks, user });
}

const nameField = () => screen.getByRole('textbox', { name: /Full name/ });

async function rename(to: string) {
  const user = userEvent.setup();
  const field = await screen.findByRole('textbox', { name: /Full name/ });
  await user.clear(field);
  await user.type(field, to);
  return user;
}

describe('the profile form', () => {
  it('waits for the stored profile before showing the fields', async () => {
    showForm([meAnswer().mock]);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Builds the payroll engine.')).toBeInTheDocument();
  });

  it('fills in the stored profile, with the sign-in address locked', async () => {
    showForm([meAnswer().mock]);

    expect(await screen.findByDisplayValue('+91 98765 43210')).toBeInTheDocument();
    expect(nameField()).toHaveValue('Asha Rao');
    const email = screen.getByRole('textbox', { name: 'Email' });
    expect(email).toHaveValue('asha@example.com');
    expect(email).toBeDisabled();
    expect(email).toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('https://www.linkedin.com/in/asha')).toBeInTheDocument();
  });

  it('turns every missing value into an empty field', async () => {
    const blank = { phone: null, brief: null, socialLinks: null, timezone: null, locale: null };
    showForm([meAnswer(blank).mock]);

    await waitFor(() => expect(nameField()).toHaveValue('Asha Rao'));
    expect(screen.getByRole('textbox', { name: /Phone/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /Bio/ })).toHaveValue('');
  });

  it('saves the changes, renames the session and says so', async () => {
    const saved = answer(
      UpdateProfileDocument,
      { updateProfile: me({ name: 'Asha R.' }) },
      { input: SAVED_INPUT },
    );
    showForm([meAnswer().mock, saved.mock, meAnswer({ name: 'Asha R.' }).mock]);
    const user = await rename('Asha R.');

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Profile updated')).toBeInTheDocument();
    expect(saved.delivered()).toBe(true);
    expect(JSON.parse(localStorage.getItem('exyconn-track.user') ?? '{}')).toMatchObject({
      name: 'Asha R.',
    });
  });

  it('says why the save failed', async () => {
    showForm([
      meAnswer().mock,
      failure(UpdateProfileDocument, { input: SAVED_INPUT }, 'Phone already in use'),
    ]);
    const user = await rename('Asha R.');

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Phone already in use')).toBeInTheDocument();
  });

  it('refuses a name that is too short, before asking the server', async () => {
    showForm([meAnswer().mock]);
    const user = await rename('A');

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Minimum 2 characters')).toBeInTheDocument();
  });

  it('puts the stored values back on cancel', async () => {
    showForm([meAnswer().mock]);
    const user = await rename('Somebody else');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(nameField()).toHaveValue('Asha Rao'));
  });

  it('starts empty for nobody signed in', async () => {
    showForm([meAnswer().mock], null);

    await screen.findByDisplayValue('+91 98765 43210');
    expect(nameField()).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('');
  });
});
