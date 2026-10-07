import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PexelsFilters } from '@/components/ui/ImageUploadDialog/PexelsFilters';
import { EMPTY_FILTERS } from '@/components/ui/ImageUploadDialog/pexels-filters';

async function choose(label: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}

async function optionsOf(label: RegExp): Promise<string[]> {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  const names = within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map((option) => option.textContent ?? '');
  await userEvent.keyboard('{Escape}');
  return names;
}

describe('PexelsFilters', () => {
  it('filters photos by shape, megapixels and colour', async () => {
    const onChange = vi.fn();
    render(<PexelsFilters kind="photos" value={EMPTY_FILTERS} onChange={onChange} />);

    expect(screen.queryByRole('combobox', { name: /Length/ })).not.toBeInTheDocument();
    expect(await optionsOf(/Size/)).toEqual([
      'Any',
      'Large (24MP+)',
      'Medium (12MP+)',
      'Small (4MP+)',
    ]);

    await choose(/Colour/, 'Blue');
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FILTERS, color: 'blue' });

    await choose(/Orientation/, 'Vertical');
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FILTERS, orientation: 'portrait' });
  });

  it('filters clips by shape, resolution and length, keeping the other filters', async () => {
    const onChange = vi.fn();
    const value = { ...EMPTY_FILTERS, orientation: 'square' };
    render(<PexelsFilters kind="videos" value={value} onChange={onChange} />);

    expect(screen.queryByRole('combobox', { name: /Colour/ })).not.toBeInTheDocument();
    expect(await optionsOf(/Size/)).toEqual([
      'Any',
      'Large (4K)',
      'Medium (Full HD)',
      'Small (HD)',
    ]);

    await choose(/Length/, 'Over 1 min');
    expect(onChange).toHaveBeenLastCalledWith({ ...value, duration: 'long' });

    await choose(/Size/, 'Small (HD)');
    expect(onChange).toHaveBeenLastCalledWith({ ...value, size: 'small' });
  });
});
