import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { RateSupportForm } from '../../../../src/pages/rate/forms/rate-support';
import { renderWithProviders } from '../../test-utils';
import { fill, findSnackbar } from '../../form-helpers';
import { TOKEN, rated } from './rate.fixtures';

function renderForm(mocks: MockLink.MockedResponse[] = []) {
  const onRated = vi.fn<() => void>();
  const onCancel = vi.fn<() => void>();
  renderWithProviders(<RateSupportForm token={TOKEN} onRated={onRated} onCancel={onCancel} />, {
    mocks,
  });
  return { onRated, onCancel };
}

const send = () => userEvent.click(screen.getByRole('button', { name: 'Send rating' }));

describe('RateSupportForm', () => {
  it('offers the five answers, best first', () => {
    renderForm();

    expect(
      screen.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent),
    ).toEqual(['5 — Very happy', '4 — Happy', '3 — Neutral', '2 — Unhappy', '1 — Very unhappy']);
  });

  it('needs a rating before it sends anything', async () => {
    const { onRated } = renderForm();

    await send();

    expect(
      await screen.findByText('Choose how happy you are with the help you got'),
    ).toBeInTheDocument();
    expect(onRated).not.toHaveBeenCalled();
  });

  it('refuses a comment over 1000 characters', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('radio', { name: '3 — Neutral' }));
    fill('Anything you would like to add?', 'x'.repeat(1001));

    await send();

    expect(await screen.findByText('Keep the comment under 1000 characters')).toBeInTheDocument();
  });

  it('sends the rating as a number with the trimmed comment', async () => {
    const { onRated } = renderForm([rated(4, 'Quick fix')]);
    await userEvent.click(screen.getByRole('radio', { name: '4 — Happy' }));
    fill('Anything you would like to add?', '  Quick fix  ');

    await send();

    await vi.waitFor(() => expect(onRated).toHaveBeenCalledTimes(1));
  });

  it('says why the rating was refused, such as a link already used', async () => {
    const { onRated } = renderForm([
      rated(1, '', 'This survey link does not work, or it has already been answered.'),
    ]);
    await userEvent.click(screen.getByRole('radio', { name: '1 — Very unhappy' }));

    await send();

    expect(
      await findSnackbar('This survey link does not work, or it has already been answered.'),
    ).toBeInTheDocument();
    expect(onRated).not.toHaveBeenCalled();
  });

  it('leaves without rating', async () => {
    const { onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });
});
