import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectBoardPage } from '../../../../../src/pages/projects/board';
import { renderWithProviders } from '../../../test-utils';
import { taskRow } from '../../../fixtures';
import { dialog } from './board-page.mocks';

const drag = vi.hoisted(() => ({ activeTask: null as unknown }));

vi.mock('../../../../../src/pages/projects/board/useProjectBoard', async () => {
  const { boardApi: board } = await import('./board-page.mocks');
  return { useProjectBoard: () => board() };
});

vi.mock('../../../../../src/pages/projects/ticket/TicketDialog', async () => ({
  TicketDialog: (await import('./board-page.mocks')).TicketDialogStub,
}));

/** A drag in progress: the hook reports the ticket being carried. */
vi.mock('../../../../../src/pages/projects/board/useBoardDnd', () => ({
  useBoardDnd: () => ({
    sensors: [],
    activeTask: drag.activeTask,
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    onDragCancel: vi.fn(),
    moveColumn: vi.fn(),
    moveTaskToColumn: vi.fn(),
  }),
}));

/** dnd-kit only paints its overlay mid-drag; here it always paints what it is given. */
vi.mock('@dnd-kit/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dnd-kit/core')>()),
  DragOverlay: ({ children }: Readonly<{ children: ReactNode }>) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
}));

describe('ProjectBoardPage drag overlay', () => {
  it('draws nothing over the board when nothing is being carried', () => {
    drag.activeTask = null;
    renderWithProviders(<ProjectBoardPage projectId="proj-1" sprintFilter="" />);

    expect(screen.getByTestId('drag-overlay')).toBeEmptyDOMElement();
  });

  it('draws the carried ticket, which does not open when it is clicked', async () => {
    drag.activeTask = taskRow({ id: 't9', key: 'EXY-9', title: 'Carried' });
    renderWithProviders(<ProjectBoardPage projectId="proj-1" sprintFilter="" />);

    const carried = screen.getByRole('button', { name: /^EXY-9: Carried/ });
    expect(screen.getByTestId('drag-overlay')).toContainElement(carried);

    await userEvent.click(carried);

    expect(dialog.props?.ticket).toBeNull();
  });
});
