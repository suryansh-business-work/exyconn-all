import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import {
  ConfirmStatusSubscriptionDocument,
  UnsubscribeFromStatusDocument,
} from '@exyconn/shell/graphql/generated';
import { ConfirmSubscriptionPage, UnsubscribePage } from '../../../../src/pages/subscribe';
import { renderWithProviders } from '../../test-utils';

const TOKEN = 'link-token-1';

const confirmed = (error?: Error): MockLink.MockedResponse => ({
  request: { query: ConfirmStatusSubscriptionDocument, variables: { token: TOKEN } },
  ...(error ? { error } : { result: { data: { confirmStatusSubscription: true } } }),
});

const unsubscribed = (): MockLink.MockedResponse => ({
  request: { query: UnsubscribeFromStatusDocument, variables: { token: TOKEN } },
  result: { data: { unsubscribeFromStatus: true } },
});

describe('ConfirmSubscriptionPage', () => {
  it('confirms on arrival, waiting a moment for the answer', async () => {
    renderWithProviders(<ConfirmSubscriptionPage />, {
      route: `/subscribe/confirm?token=${TOKEN}`,
      mocks: [confirmed()],
    });
    expect(screen.getByText('Status updates')).toBeInTheDocument();
    expect(screen.getByText('Just a moment…')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'You are subscribed. We will email you when something breaks and again when it is fixed.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Just a moment…')).not.toBeInTheDocument();
  });

  it('explains a link that lost its token, without calling the API', () => {
    renderWithProviders(<ConfirmSubscriptionPage />, { route: '/subscribe/confirm' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This confirmation link is missing its token. Open the link from the email again.',
    );
    expect(screen.queryByText('Just a moment…')).not.toBeInTheDocument();
  });

  it('shows the reason a link could not be used', async () => {
    renderWithProviders(<ConfirmSubscriptionPage />, {
      route: `/subscribe/confirm?token=${TOKEN}`,
      mocks: [confirmed(new Error('This link has expired'))],
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('This link has expired');
  });
});

describe('UnsubscribePage', () => {
  it('unsubscribes on arrival', async () => {
    renderWithProviders(<UnsubscribePage />, {
      route: `/unsubscribe?token=${TOKEN}`,
      mocks: [unsubscribed()],
    });
    expect(
      await screen.findByText('You are unsubscribed. We will not email you about incidents again.'),
    ).toBeInTheDocument();
  });

  it('explains a link that lost its token', () => {
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This unsubscribe link is missing its token. Open the link from the email again.',
    );
  });
});
