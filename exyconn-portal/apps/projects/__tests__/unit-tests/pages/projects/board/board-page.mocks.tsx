import { vi } from 'vitest';
import type { ProjectBoardApi } from '../../../../../src/pages/projects/board';
import { taskRow } from '../../../fixtures';

interface DialogProps {
  ticket: { key: string } | null;
  onClose: () => void;
  onChanged: () => void;
  board: { columns: unknown[]; onMove: (taskId: string, columnId: string) => void };
}

/** The last props the ticket dialog stand-in was rendered with. */
export const dialog: { props: DialogProps | null } = { props: null };

/** Stands in for the ticket dialog (it has its own tests): names the open ticket. */
export function TicketDialogStub(props: Readonly<DialogProps>) {
  dialog.props = props;
  if (!props.ticket) {
    return null;
  }
  return (
    <div>
      <p>{`Ticket ${props.ticket.key} is open`}</p>
      <button type="button" onClick={props.onClose}>
        Close ticket
      </button>
    </div>
  );
}

/** A board as useProjectBoard hands it over: two columns, three tickets, spies for every write. */
export function boardApi(overrides: Partial<ProjectBoardApi> = {}): ProjectBoardApi {
  return {
    loading: false,
    columns: [
      { id: 'todo', name: 'To do', isDone: false },
      { id: 'done', name: 'Done', isDone: true },
    ],
    tasks: [
      taskRow({ id: 't1', key: 'EXY-1', title: 'Login fails', columnId: 'todo', sprintId: 's1' }),
      taskRow({ id: 't2', key: 'EXY-2', title: 'Logout hangs', columnId: 'todo' }),
      taskRow({ id: 't3', key: 'EXY-3', title: 'Ship it', columnId: 'done', sprintId: 's1' }),
    ],
    setColumns: vi.fn(),
    setTasks: vi.fn(),
    addColumn: vi.fn(),
    editColumn: vi.fn(),
    toggleColumnDone: vi.fn(),
    removeColumn: vi.fn(),
    addTask: vi.fn(),
    persistColumnOrder: vi.fn(),
    persistTaskMove: vi.fn(),
    reload: vi.fn(),
    ...overrides,
  };
}
