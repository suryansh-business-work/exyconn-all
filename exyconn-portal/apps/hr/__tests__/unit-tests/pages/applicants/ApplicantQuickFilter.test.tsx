import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicantStage, FilterOp } from '@exyconn/shell/graphql/generated';
import {
  ApplicantQuickFilter,
  stageFilters,
} from '../../../../src/pages/applicants/ApplicantQuickFilter';
import { renderWithProviders } from '../../test-utils';

describe('stageFilters', () => {
  it('adds no filter for the whole pipeline', () => {
    expect(stageFilters('all')).toEqual([]);
  });

  it('filters the server query to one stage', () => {
    expect(stageFilters(ApplicantStage.Offer)).toEqual([
      { field: 'stage', op: FilterOp.Equals, value: 'OFFER' },
    ]);
  });
});

describe('ApplicantQuickFilter', () => {
  it('offers All and every stage, with the current choice pressed', () => {
    renderWithProviders(
      <ApplicantQuickFilter value={ApplicantStage.Interview} onChange={vi.fn()} />,
    );

    const group = screen.getByRole('group', { name: 'Stage filter' });
    expect(group).toBeInTheDocument();
    const names = screen.getAllByRole('button').map((button) => button.textContent);
    expect(names).toHaveLength(7);
    expect(names).toEqual(
      expect.arrayContaining([
        'All',
        'New',
        'Screening',
        'Interview',
        'Offer',
        'Hired',
        'Rejected',
      ]),
    );
    expect(screen.getByRole('button', { name: 'Interview' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the stage picked', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ApplicantQuickFilter value="all" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Hired' }));

    expect(onChange).toHaveBeenCalledWith(ApplicantStage.Hired);
  });

  it('ignores a click on the choice already pressed, which would otherwise clear it', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ApplicantQuickFilter value="all" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'All' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
