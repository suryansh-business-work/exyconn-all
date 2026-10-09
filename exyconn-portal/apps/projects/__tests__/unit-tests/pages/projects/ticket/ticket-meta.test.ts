import { describe, expect, it } from 'vitest';
import { TaskPriority, TaskType } from '@exyconn/shell/graphql/generated';
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_OPTIONS,
  TICKET_TYPES,
  TICKET_TYPE_OPTIONS,
  initialsOf,
} from '../../../../../src/pages/projects/ticket';

describe('initialsOf', () => {
  it('takes the first letter of the first two names, upper-cased', () => {
    expect(initialsOf('Asha Rao')).toBe('AR');
    expect(initialsOf('asha maria rao')).toBe('AM');
  });

  it('copes with one name and with stray spaces', () => {
    expect(initialsOf('Priya')).toBe('P');
    expect(initialsOf('  Asha   Rao ')).toBe('AR');
  });

  it('is empty for nobody', () => {
    expect(initialsOf('')).toBe('');
  });
});

const byName = (a: string, b: string) => a.localeCompare(b);

describe('ticket facets', () => {
  it('draws every type and priority the schema has, each with a label, icon and colour', () => {
    expect(Object.keys(TICKET_TYPES).sort(byName)).toEqual(Object.values(TaskType).sort(byName));
    expect(Object.keys(TICKET_PRIORITIES).sort(byName)).toEqual(
      Object.values(TaskPriority).sort(byName),
    );
    for (const facet of [...Object.values(TICKET_TYPES), ...Object.values(TICKET_PRIORITIES)]) {
      expect(facet.label).not.toBe('');
      expect(facet.icon).toBeTruthy();
      expect(facet.color).toMatch(/^#|^rgb/);
    }
  });

  it('offers the types in their table order', () => {
    expect(TICKET_TYPE_OPTIONS).toEqual([
      { value: TaskType.Story, label: 'Story' },
      { value: TaskType.Task, label: 'Task' },
      { value: TaskType.Bug, label: 'Bug' },
      { value: TaskType.Epic, label: 'Epic' },
    ]);
  });

  it('offers the priorities from highest to lowest', () => {
    expect(TICKET_PRIORITY_OPTIONS.map((option) => option.label)).toEqual([
      'Highest',
      'High',
      'Medium',
      'Low',
      'Lowest',
    ]);
    expect(TICKET_PRIORITY_OPTIONS[0].value).toBe(TaskPriority.Highest);
  });
});
