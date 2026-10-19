import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ContactPointsField,
  ProfileFields,
  emailPointSchema,
  emailPointsOf,
  pictureUrlSchema,
  profileDefaults,
  profileSchema,
  type EmailPointValues,
  type ProfileValues,
} from '../../../../src/records/profile';
import { renderWithProviders } from '../../test-utils';

describe('profile schema', () => {
  const valid: ProfileValues = {
    phones: [{ number: '+91 98765 43210', label: 'Work', primary: true }],
    website: 'https://acme.io',
    linkedinUrl: '',
    twitterUrl: '',
    address: '',
    city: 'Pune',
    country: 'IN',
    timezone: 'Asia/Kolkata',
    description: '',
  };

  it('accepts a complete profile and blank links', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a link without https and an over-long city', () => {
    const result = profileSchema.safeParse({ ...valid, website: 'acme.io', city: 'x'.repeat(101) });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Use a full address starting with https://',
      'Too long',
    ]);
  });

  it('requires a valid email address and a short label', () => {
    const blank = emailPointSchema.safeParse({ address: ' ', label: 'Work', primary: false });
    expect(blank.error?.issues[0].message).toBe('Enter the address');
    const wrong = emailPointSchema.safeParse({ address: 'nope', label: 'x'.repeat(41), primary: false });
    expect(wrong.error?.issues.map((issue) => issue.message)).toEqual([
      'Enter a valid email',
      'Keep the label short',
    ]);
  });

  it('accepts an uploaded picture address or blank', () => {
    expect(pictureUrlSchema.safeParse('https://cdn.io/a.png').success).toBe(true);
    expect(pictureUrlSchema.safeParse('').success).toBe(true);
    expect(pictureUrlSchema.safeParse('a.png').error?.issues[0].message).toBe(
      'Upload the picture again',
    );
  });

  it('reads defaults from a record without the __typename', () => {
    const row = {
      emails: [{ __typename: 'CrmEmailAddress', address: 'a@b.io', label: 'Work', primary: true }],
      phones: [{ __typename: 'CrmPhoneNumber', number: '1', label: 'Home', primary: false }],
      website: 'https://acme.io',
      linkedinUrl: 'https://linkedin.com/in/a',
      twitterUrl: 'https://x.com/a',
      address: 'Street 1',
      city: 'Pune',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      description: 'About',
    };
    expect(emailPointsOf(row)).toEqual([{ address: 'a@b.io', label: 'Work', primary: true }]);
    expect(profileDefaults(row)).toEqual({
      phones: [{ number: '1', label: 'Home', primary: false }],
      website: 'https://acme.io',
      linkedinUrl: 'https://linkedin.com/in/a',
      twitterUrl: 'https://x.com/a',
      address: 'Street 1',
      city: 'Pune',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      description: 'About',
    });
  });

  it('starts blank for a new record or missing fields', () => {
    expect(emailPointsOf(null)).toEqual([]);
    expect(emailPointsOf({ emails: null })).toEqual([]);
    const blank = {
      phones: [],
      website: '',
      linkedinUrl: '',
      twitterUrl: '',
      address: '',
      city: '',
      country: '',
      timezone: '',
      description: '',
    };
    expect(profileDefaults(null)).toEqual(blank);
    expect(profileDefaults({ phones: null, website: null })).toEqual(blank);
  });
});

const pointsSchema = z.object({ emails: z.array(emailPointSchema).min(1, 'Add an email') });
type PointsValues = { emails: EmailPointValues[] };

function PointsHarness({
  initial,
  onSubmit,
}: Readonly<{ initial: EmailPointValues[]; onSubmit: (values: PointsValues) => void }>) {
  const form = useForm<PointsValues>({
    resolver: zodResolver(pointsSchema),
    defaultValues: { emails: initial },
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ContactPointsField
          name="emails"
          title="Email addresses"
          inputLabel="Email"
          addLabel="Add email"
        />
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}

describe('ContactPointsField', () => {
  it('makes the first added address primary and the next one not', async () => {
    const onSubmit = (values: PointsValues) => submitted.push(values);
    const submitted: PointsValues[] = [];
    renderWithProviders(<PointsHarness initial={[]} onSubmit={onSubmit} />);
    expect(screen.getByRole('heading', { name: 'Email addresses' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add email' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add email' }));
    const [first, second] = screen.getAllByLabelText('Email');
    await userEvent.type(first, 'a@b.io');
    await userEvent.type(second, 'c@d.io');
    expect(screen.getByRole('button', { name: 'Primary 1' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Make primary 2' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].emails).toEqual([
      { address: 'a@b.io', label: 'Work', primary: true },
      { address: 'c@d.io', label: 'Work', primary: false },
    ]);
  });

  it('moves the star and removes rows', async () => {
    const submitted: PointsValues[] = [];
    renderWithProviders(
      <PointsHarness
        initial={[
          { address: 'a@b.io', label: 'Work', primary: true },
          { address: 'c@d.io', label: 'Home', primary: false },
        ]}
        onSubmit={(values) => submitted.push(values)}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Make primary 2' }));
    expect(screen.getByRole('button', { name: 'Primary 2' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Email 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].emails).toEqual([{ address: 'c@d.io', label: 'Home', primary: true }]);
  });

  it('shows the list error when the last row is removed', async () => {
    renderWithProviders(
      <PointsHarness
        initial={[{ address: 'a@b.io', label: 'Work', primary: true }]}
        onSubmit={() => undefined}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Email 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Add an email')).toBeInTheDocument();
  });
});

function PhonesHarness({ onSubmit }: Readonly<{ onSubmit: (values: unknown) => void }>) {
  const form = useForm({ defaultValues: { phones: [] } });
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ContactPointsField name="phones" title="Phone numbers" inputLabel="Phone" addLabel="Add phone" />
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}

describe('ContactPointsField for phones', () => {
  it('keeps each number under its number key', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<PhonesHarness onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add phone' }));
    await userEvent.type(screen.getByLabelText('Phone'), '+91 98765 43210');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onSubmit.mock.calls[0][0]).toEqual({
        phones: [{ number: '+91 98765 43210', label: 'Work', primary: true }],
      }),
    );
  });
});

function ProfileHarness({ timezone }: Readonly<{ timezone: string }>) {
  const form = useForm<ProfileValues>({ defaultValues: { ...profileDefaults(null), timezone } });
  return (
    <FormProvider {...form}>
      <ProfileFields aboutLabel="About the company" />
    </FormProvider>
  );
}

describe('ProfileFields', () => {
  it('lays out the web and location fields with the given about label', async () => {
    renderWithProviders(<ProfileHarness timezone="Asia/Kolkata" />);
    expect(screen.getByRole('heading', { name: 'Online' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Location' })).toBeInTheDocument();
    for (const label of ['Website', 'LinkedIn', 'X (Twitter)', 'Address', 'City']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText('About the company')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: 'Country' }));
    expect(within(screen.getByRole('listbox')).getByRole('option', { name: 'India' })).toBeVisible();
  });
});
