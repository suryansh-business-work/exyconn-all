import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ChartTable } from '../../../src/charts/ChartTable';
import type { ChartData } from '../../../src/charts/chart.types';

const data: ChartData = {
  labels: ['Mon', 'Tue'],
  series: [
    { id: 'worked', label: 'Worked', values: [7.5, 6] },
    { id: 'idle', label: 'Idle', values: [1] },
  ],
};

describe('ChartTable', () => {
  it('heads the label column and one column per series', () => {
    render(<ChartTable data={data} formatValue={(v) => `${v}h`} labelHeading="Day" />);
    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual(['Day', 'Worked', 'Idle']);
  });

  it('writes every value through the formatter, a missing one as zero', () => {
    render(<ChartTable data={data} formatValue={(v) => `${v}h`} labelHeading="Day" />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(
      within(rows[0])
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Mon', '7.5h', '1h']);
    expect(
      within(rows[1])
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Tue', '6h', '0h']);
    expect(within(rows[0]).getAllByRole('cell')[1]).toHaveStyle({
      fontVariantNumeric: 'tabular-nums',
    });
  });

  it('renders only the heading row when there are no labels', () => {
    render(
      <ChartTable data={{ labels: [], series: [] }} formatValue={String} labelHeading="Hour" />,
    );
    expect(screen.getAllByRole('row')).toHaveLength(1);
    expect(screen.getByRole('columnheader')).toHaveTextContent('Hour');
  });
});
