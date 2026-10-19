import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BatchList } from '../../../../src/pages/email-verifier/BatchList';
import { renderWithProviders } from '../../test-utils';
import { batch } from './email-verifier-fixtures';

describe('BatchList', () => {
  it('says so when nothing has been uploaded yet', () => {
    renderWithProviders(<BatchList batches={[]} />);

    expect(screen.getByText('No bulk checks yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows each upload with its progress and what it found', () => {
    renderWithProviders(<BatchList batches={[batch()]} />);

    expect(screen.getByRole('heading', { name: 'leads.csv' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '3 of 8 checked' })).toHaveAttribute(
      'aria-valuenow',
      '38',
    );
    expect(
      screen.getByText('3 of 8 checked · 1 verified · 1 risky · 1 invalid · 0 unknown'),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Uploaded .+ by Priya$/)).toBeInTheDocument();
  });

  it('counts an empty file as done rather than dividing by zero', () => {
    renderWithProviders(
      <BatchList
        batches={[
          batch({ id: 'batch-1', name: 'empty.csv', total: 0, processed: 0 }),
          batch({ id: 'batch-2', name: 'done.csv', total: 4, processed: 4 }),
        ]}
      />,
    );

    const bars = screen.getAllByRole('progressbar');
    expect(bars.map((bar) => bar.getAttribute('aria-valuenow'))).toEqual(['100', '100']);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
