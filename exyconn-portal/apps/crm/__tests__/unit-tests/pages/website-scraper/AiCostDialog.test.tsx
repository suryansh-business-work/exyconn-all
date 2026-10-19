import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiCostDialog } from '../../../../src/pages/website-scraper/AiCostDialog';
import type { AiEstimate } from '../../../../src/pages/website-scraper/useAiAnalysis';
import { renderWithProviders } from '../../test-utils';
import { estimate } from './scraper-fixtures';

function renderDialog(value: AiEstimate | null) {
  const onProceed = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<AiCostDialog estimate={value} onProceed={onProceed} onCancel={onCancel} />);
  return { onProceed, onCancel };
}

describe('AiCostDialog', () => {
  it('stays closed until there is a price to show', () => {
    renderDialog(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the model, the estimated cost and the token counts', () => {
    renderDialog(estimate());
    const dialog = screen.getByRole('dialog', { name: 'Send this page to the AI?' });

    expect(within(dialog).getByText('gpt-4o-mini')).toBeInTheDocument();
    expect(within(dialog).getByText('$0.0012')).toBeInTheDocument();
    expect(within(dialog).getByText('≈ 1,200')).toBeInTheDocument();
    expect(within(dialog).getByText('≈ 400')).toBeInTheDocument();
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('warns when the model has no price on file and when the page is cut short', () => {
    renderDialog(estimate({ priced: false, truncated: true }));

    expect(
      screen.getByText(
        'No price on file for this model in Tech > AI Pricing, so the cost shows as 0.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('The page is long: the AI reads only its first 60,000 characters.'),
    ).toBeInTheDocument();
  });

  it('proceeds or cancels on the matching button', async () => {
    const { onProceed, onCancel } = renderDialog(estimate());

    await userEvent.click(screen.getByRole('button', { name: 'Proceed' }));
    expect(onProceed).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
