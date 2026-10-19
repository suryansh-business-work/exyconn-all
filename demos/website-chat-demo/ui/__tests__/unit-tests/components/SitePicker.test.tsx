import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SitePicker } from '../../../src/components/SitePicker';
import { site } from '../fixtures';
import { renderWithProviders } from '../test-utils';

const SITES = [site('advisory'), site('store', { icon: 'chat' })];

describe('the website picker', () => {
  it('marks the site on screen and picks another', async () => {
    const onPick = vi.fn();
    renderWithProviders(<SitePicker sites={SITES} current="advisory" onPick={onPick} />);
    expect(screen.getByRole('group', { name: 'Pick a website' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Services firm/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Online store/ }));
    expect(onPick).toHaveBeenCalledWith('store');
  });

  it('keeps the current site when it is pressed again', async () => {
    const onPick = vi.fn();
    renderWithProviders(<SitePicker sites={SITES} current="advisory" onPick={onPick} />);
    await userEvent.click(screen.getByRole('button', { name: /Services firm/ }));
    expect(onPick).not.toHaveBeenCalled();
  });
});
