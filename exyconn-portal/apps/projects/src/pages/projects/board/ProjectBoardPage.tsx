import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Box, CircularProgress, Flex } from '@exyconn/shell/components/ui';
import { useProjectBoard } from './useProjectBoard';
import { useBoardDnd } from './useBoardDnd';
import { BoardColumnCard } from './BoardColumnCard';
import { TaskCard } from './TaskCard';
import { AddItemInput } from './AddItemInput';
import { TicketDialog } from '../ticket';
import { tasksForSprint } from '../sprints/sprint-progress';

interface ProjectBoardPageProps {
  projectId: string;
  /** Which sprint the board is showing: a sprint id, `BACKLOG`, or '' for everything. */
  sprintFilter: string;
}

/**
 * The board: columns a project defines for itself, tickets dragged between them, and the
 * ticket dialog over the top. Columns are the project's own — nothing here assumes a fixed
 * To do / In progress / Done, because no two teams agree on those.
 */
export function ProjectBoardPage({ projectId, sprintFilter }: Readonly<ProjectBoardPageProps>) {
  const board = useProjectBoard(projectId);
  const { sensors, activeTask, onDragStart, onDragEnd } = useBoardDnd(board);
  const [openId, setOpenId] = useState<string | null>(null);

  // Filtering here rather than in the hook keeps drag-and-drop working on the whole board:
  // the move persists against every ticket's real order, not against the visible subset.
  const visible = tasksForSprint(board.tasks, sprintFilter);
  const tasksOf = (columnId: string) => visible.filter((t) => t.columnId === columnId);
  const openTicket = board.tasks.find((task) => task.id === openId) ?? null;

  if (board.loading && board.columns.length === 0) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', flex: 1, py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <Flex
          direction="row"
          spacing={2}
          sx={{ flex: 1, minHeight: 0, overflowX: 'auto', alignItems: 'flex-start', pb: 1 }}
        >
          <SortableContext
            items={board.columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {board.columns.map((column) => (
              <BoardColumnCard
                key={column.id}
                column={column}
                tasks={tasksOf(column.id)}
                onRename={board.editColumn}
                onDelete={board.removeColumn}
                onAddTask={board.addTask}
                onOpenTask={setOpenId}
              />
            ))}
          </SortableContext>

          <Box sx={{ width: 280, flexShrink: 0 }}>
            <AddItemInput label="Add column" placeholder="Column name" onAdd={board.addColumn} />
          </Box>
        </Flex>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onOpen={() => undefined} /> : null}
        </DragOverlay>
      </DndContext>

      <TicketDialog ticket={openTicket} onClose={() => setOpenId(null)} onChanged={board.reload} />
    </>
  );
}
