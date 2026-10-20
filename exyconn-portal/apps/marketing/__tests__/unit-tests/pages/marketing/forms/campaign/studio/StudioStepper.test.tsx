import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudioStepper } from '../../../../../../../src/pages/marketing/forms/campaign/studio/StudioStepper';
import { renderWithProviders } from '../../../../../test-utils';

/** jsdom has no media queries; this makes every `down('md')` query match or not. */
function screenIsNarrow(narrow: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: narrow,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe('StudioStepper', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('names every step, marks the current one and lets reached steps be chosen', async () => {
    screenIsNarrow(false);
    const onSelect = vi.fn();
    renderWithProviders(<StudioStepper step="design" reachable={3} onSelect={onSelect} />);
    expect(screen.getByRole('tab', { name: /Email design/ })).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(screen.getByRole('tab', { name: /Campaign setup/ })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('tab', { name: /Personalization/ })).toBeEnabled();
    expect(screen.getByRole('tab', { name: /Test & preview/ })).toBeDisabled();
    expect(screen.getByRole('tab', { name: /Review & schedule/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('tab', { name: /Audience/ }));
    expect(onSelect).toHaveBeenCalledWith('audience');
  });

  it('marks the steps before the current one as done', () => {
    screenIsNarrow(false);
    renderWithProviders(<StudioStepper step="audience" reachable={5} onSelect={vi.fn()} />);
    const done = document.querySelectorAll('.MuiStepLabel-label.Mui-completed');
    expect(Array.from(done, (node) => node.textContent)).toEqual(['Campaign setup']);
  });

  it('labels only the current step on a phone', () => {
    screenIsNarrow(true);
    renderWithProviders(<StudioStepper step="test" reachable={5} onSelect={vi.fn()} />);
    expect(screen.getByText('Test & preview')).toBeInTheDocument();
    expect(screen.queryByText('Campaign setup')).not.toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(6);
  });
});
