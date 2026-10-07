import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { SubscribeToStatusDocument } from '@exyconn/shell/graphql/generated';
import { SubscribeCard } from '../../../../src/pages/subscribe';
import { renderWithProviders } from '../../test-utils';
import { fill, findSnackbar } from '../../form-helpers';

const EMAIL = 'ada@example.com';

const subscribed = (email: string, error?: Error): MockLink.MockedResponse => ({
  request: { query: SubscribeToStatusDocument, variables: { email } },
  ...(error ? { error } : { result: { data: { subscribeToStatus: true } } }),
});

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Email me updates' }));

describe('SubscribeCard', () => {
  it('promises only a confirmation email once the address is accepted', async () => {
    renderWithProviders(<SubscribeCard />, { mocks: [subscribed(EMAIL)] });
    expect(screen.getByText('Subscribe to updates')).toBeInTheDocument();
    fill('Your email', `  ${EMAIL} `);
    await submit();

    expect(
      await screen.findByText(
        `Check ${EMAIL} for a confirmation link. Nothing else is sent until you follow it.`,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Your email')).not.toBeInTheDocument();
  });

  it('asks for an address before sending anything', async () => {
    renderWithProviders(<SubscribeCard />);
    await submit();
    expect(await screen.findByText('Enter your email address')).toBeInTheDocument();
  });

  it('refuses something that is not an email address', async () => {
    renderWithProviders(<SubscribeCard />);
    fill('Your email', 'not-an-email');
    await submit();
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('keeps the form and says what went wrong when the API refuses', async () => {
    renderWithProviders(<SubscribeCard />, {
      mocks: [subscribed(EMAIL, new Error('Too many requests'))],
    });
    fill('Your email', EMAIL);
    await submit();

    expect(await findSnackbar('Too many requests')).toBeInTheDocument();
    expect(screen.getByLabelText('Your email')).toHaveValue(EMAIL);
    expect(screen.queryByText(/for a confirmation link/)).not.toBeInTheDocument();
  });

  it('clears the field on Cancel', async () => {
    renderWithProviders(<SubscribeCard />);
    fill('Your email', EMAIL);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('Your email')).toHaveValue('');
  });
});
