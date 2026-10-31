import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { RateSupportPage } from '../../../../src/pages/rate';
import { renderWithProviders } from '../../test-utils';
import { currentUrl } from '../../form-helpers';
import { TOKEN, rated, survey, surveyLookup } from './rate.fixtures';

function renderPage(mocks: MockLink.MockedResponse[], route = `/help/rate/${TOKEN}`) {
  renderWithProviders(<RateSupportPage />, { mocks, route, path: '/help/rate/:token?' });
}

describe('RateSupportPage', () => {
  it('asks how the resolved ticket went', async () => {
    renderPage([surveyLookup(survey())]);

    expect(await screen.findByRole('heading', { name: 'How did we do?' })).toBeInTheDocument();
    expect(
      screen.getByText('Your ticket EXY-ABC234 — Invoice is wrong — is resolved.'),
    ).toBeInTheDocument();
  });

  it('thanks the customer once the rating is in', async () => {
    renderPage([surveyLookup(survey()), rated(5, ''), surveyLookup(survey(5))]);
    await userEvent.click(await screen.findByRole('radio', { name: '5 — Very happy' }));

    await userEvent.click(screen.getByRole('button', { name: 'Send rating' }));

    expect(await screen.findByText('Thank you for your feedback')).toBeInTheDocument();
  });

  it('keeps thanking the customer when the survey cannot be read back afterwards', async () => {
    renderPage([surveyLookup(survey()), rated(3, '')]);
    await userEvent.click(await screen.findByRole('radio', { name: '3 — Neutral' }));

    await userEvent.click(screen.getByRole('button', { name: 'Send rating' }));

    expect(await screen.findByText('Thank you for your feedback')).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText('Thank you for your feedback')).toBeInTheDocument();
  });

  it('shows an earlier answer instead of asking again', async () => {
    renderPage([surveyLookup(survey(2))]);

    expect(await screen.findByText('Thank you for your feedback')).toBeInTheDocument();
    expect(screen.getByText('You rated our support 2 out of 5.')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('says a forged or unknown link no longer works', async () => {
    renderPage([surveyLookup(null)]);

    expect(await screen.findByText('This link no longer works')).toBeInTheDocument();
  });

  it('asks nothing for a link without a token', () => {
    renderPage([], '/help/rate');

    expect(screen.getByText('This link no longer works')).toBeInTheDocument();
  });

  it('goes back to the status page when the customer leaves without rating', async () => {
    renderPage([surveyLookup(survey())]);

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(await screen.findByTestId('current-url')).toHaveTextContent(/^\/$/);
    expect(currentUrl()).toBe('/');
  });
});
