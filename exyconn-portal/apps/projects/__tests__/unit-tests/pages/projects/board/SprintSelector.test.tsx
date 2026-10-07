import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { SprintState } from '@exyconn/shell/graphql/generated';
import { SprintSelector } from '../../../../../src/pages/projects/board';
import { BACKLOG } from '../../../../../src/pages/projects/sprints/sprint-progress';
import { renderWithProviders } from '../../../test-utils';
import { sprintRow } from '../../../fixtures';
import { optionsOf, pickOption } from '../../../helpers/form-helpers';

const SPRINTS = [
  sprintRow({ id: 's1', name: 'Sprint 11', state: SprintState.Completed }),
  sprintRow({ id: 's2', name: 'Sprint 12', state: SprintState.Active }),
  sprintRow({ id: 's3', name: 'Sprint 13', state: SprintState.Planned }),
];

describe('SprintSelector', () => {
  it('offers everything, the backlog and every sprint, marking the running one', async () => {
    renderWithProviders(<SprintSelector sprints={SPRINTS} value="" onChange={vi.fn()} />);

    expect(await optionsOf(/^Sprint/)).toEqual([
      'All tickets',
      'Backlog',
      'Sprint 11',
      'Sprint 12 · running',
      'Sprint 13',
    ]);
  });

  it('shows the current choice', () => {
    renderWithProviders(<SprintSelector sprints={SPRINTS} value="s1" onChange={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: /^Sprint/ })).toHaveTextContent('Sprint 11');
  });

  it('reports the chosen sprint, or the backlog, by its value', async () => {
    const onChange = vi.fn();
    renderWithProviders(<SprintSelector sprints={SPRINTS} value="" onChange={onChange} />);

    await pickOption(/^Sprint/, 'Sprint 13');
    await pickOption(/^Sprint/, 'Backlog');

    expect(onChange.mock.calls).toEqual([['s3'], [BACKLOG]]);
  });
});
