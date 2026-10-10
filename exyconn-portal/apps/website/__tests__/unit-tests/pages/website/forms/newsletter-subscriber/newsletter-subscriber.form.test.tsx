import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseEntitySaveOptions } from '@exyconn/shell/components/form/useEntitySave';
import {
  NewsletterSubscriberForm,
  type NewsletterSubscriberFormValues,
  type NewsletterSubscriberRow,
} from '../../../../../../src/pages/website/forms/newsletter-subscriber';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({
  add: vi.fn(),
  saveOptions: null as UseEntitySaveOptions<
    NewsletterSubscriberFormValues,
    NewsletterSubscriberRow
  > | null,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAddNewsletterSubscriberMutation: () => [gql.add],
}));

/** The real save hook, with the options the form hands it recorded. */
vi.mock('@exyconn/shell/components/form/useEntitySave', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@exyconn/shell/components/form/useEntitySave')>();
  return {
    useEntitySave: (
      options: UseEntitySaveOptions<NewsletterSubscriberFormValues, NewsletterSubscriberRow>,
    ) => {
      gql.saveOptions = options;
      return actual.useEntitySave(options);
    },
  };
});

function setup() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <NewsletterSubscriberForm siteId="site-1" onDone={onDone} onCancel={onCancel} />,
  );
  return { user: userEvent.setup(), onDone, onCancel };
}

const submit = () => screen.getByRole('button', { name: 'Add subscriber' });

describe('NewsletterSubscriberForm', () => {
  beforeEach(() => {
    gql.add.mockReset();
  });

  it('never edits a subscriber: the update step resolves without a mutation', async () => {
    setup();
    const row = { id: 'sub-1', email: 'a@b.co' } as NewsletterSubscriberRow;

    await expect(
      gql.saveOptions?.update(row, { email: 'a@b.co', name: '' }),
    ).resolves.toBeUndefined();
    expect(gql.add).not.toHaveBeenCalled();
  });

  it('adds a subscriber with a name', async () => {
    gql.add.mockResolvedValue({ data: {} });
    const { user, onDone } = setup();

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'asha@example.com');
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Asha Rao');
    await user.click(submit());

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.add).toHaveBeenCalledWith({
      variables: { siteId: 'site-1', email: 'asha@example.com', name: 'Asha Rao' },
    });
    expect(await screen.findByText('Subscriber created')).toBeInTheDocument();
  });

  it('sends no name when none was given', async () => {
    gql.add.mockResolvedValue({ data: {} });
    const { user, onDone } = setup();

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ravi@example.com');
    await user.click(submit());

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.add).toHaveBeenCalledWith({
      variables: { siteId: 'site-1', email: 'ravi@example.com', name: null },
    });
  });

  it('requires a valid email and a short name', async () => {
    const { user } = setup();

    await user.click(submit());
    expect(await screen.findByText('Email is required')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'not-an-email');
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();

    await user.click(screen.getByRole('textbox', { name: 'Name' }));
    await user.paste('n'.repeat(121));
    await user.click(submit());
    expect(await screen.findByText('Keep the name under 120 characters')).toBeInTheDocument();
    expect(gql.add).not.toHaveBeenCalled();
  });

  it('shows the server refusal', async () => {
    gql.add.mockRejectedValue(new Error('This address unsubscribed'));
    const { user, onDone } = setup();

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'gone@example.com');
    await user.click(submit());

    expect(await screen.findByText('This address unsubscribed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels', async () => {
    const { user, onCancel } = setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
