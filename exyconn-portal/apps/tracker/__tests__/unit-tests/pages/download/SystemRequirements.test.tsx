import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { SystemRequirements } from '../../../../src/pages/download/SystemRequirements';
import { renderWithProviders } from '../../test-utils';
import { platformOf } from './download.fixtures';

const bodyRows = () => screen.getAllByRole('row').slice(1);

const cellsOf = (row: HTMLElement) =>
  within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);

describe('SystemRequirements', () => {
  it('heads the table with what, minimum and recommended, tagged with the platform', () => {
    renderWithProviders(<SystemRequirements platform={platformOf('windows')} />);

    expect(screen.getByText('System requirements')).toBeInTheDocument();
    expect(screen.getByText('Windows')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'What',
      'Minimum',
      'Recommended',
    ]);
  });

  it('puts the operating system first, then every hardware row of a desktop', () => {
    const windows = platformOf('windows');
    renderWithProviders(<SystemRequirements platform={windows} />);
    const rows = bodyRows();

    expect(rows).toHaveLength(windows.hardware.length + 1);
    expect(cellsOf(rows[0])).toEqual(['Operating system', windows.minOs, windows.recommendedOs]);
    windows.hardware.forEach((hardware, index) => {
      expect(cellsOf(rows[index + 1])).toEqual([
        hardware.label,
        hardware.minimum,
        hardware.recommended,
      ]);
    });
  });

  it('asks a phone only for its OS and a network connection', () => {
    const ios = platformOf('ios');
    renderWithProviders(<SystemRequirements platform={ios} />);
    const rows = bodyRows();

    expect(rows).toHaveLength(2);
    expect(cellsOf(rows[0])).toEqual(['Operating system', 'iOS 16.4', ios.recommendedOs]);
    expect(cellsOf(rows[1])[0]).toBe('Network');
  });
});
