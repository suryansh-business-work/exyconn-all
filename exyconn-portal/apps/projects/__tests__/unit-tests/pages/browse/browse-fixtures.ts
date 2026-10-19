import { TaskVisibility, type TaskByKeyQuery } from '@exyconn/shell/graphql/generated';
import { taskRow } from '../../fixtures';

export type TicketPageFixture = NonNullable<TaskByKeyQuery['taskByKey']>;

/** The ticket the page opens: EXY-1 on proj-1, private until made public. */
export function pageTicket(overrides: Partial<TicketPageFixture> = {}): TicketPageFixture {
  return {
    ...taskRow(),
    projectId: 'proj-1',
    visibility: TaskVisibility.Private,
    publicUrl: null,
    ...overrides,
  };
}

/** The project's board columns. */
export const COLUMNS = [
  { __typename: 'BoardColumn' as const, id: 'todo', name: 'To do', isDone: false },
  { __typename: 'BoardColumn' as const, id: 'done', name: 'Done', isDone: true },
];
