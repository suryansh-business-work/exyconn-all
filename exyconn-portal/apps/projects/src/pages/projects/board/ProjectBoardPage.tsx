import { useState } from 'react';
import { DndContext, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanDragOverlay, overlayGrip } from '@exyconn/kanban';
import { Box, Flex } from '@exyconn/shell/components/ui';
import { useProjectBoard } from './useProjectBoard';
import { useBoardDnd } from './useBoardDnd';
import { useBoardAnnouncements } from './useBoardAnnouncements';
import { BoardColumnCard } from './BoardColumnCard';
import { TaskCard } from './TaskCard';
import { AddItemInput } from './AddItemInput';
import { TicketDialog, epicOptionsOf } from '../ticket';
import { tasksForSprint } from '../sprints/sprint-progress';
import { CardGridSkeleton } from '@exyconn/shell/components/feedback/skeletons';

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
  const {
    sensors,
    layout,
    activeTask,
    targetColumn,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    moveColumn,
    moveTaskToColumn,
  } = useBoardDnd(board);
  const accessibility = useBoardAnnouncements(board.columns, board.tasks);
  const [openId, setOpenId] = useState<string | null>(null);

  // Filtering here rather than in the hook keeps drag-and-drop working on the whole board:
  // the move persists against every ticket's real order, not against the visible subset.
  // The layout is the drag's preview while a ticket is carried, so its slot moves with it.
  const visible = new Map(tasksForSprint(board.tasks, sprintFilter).map((task) => [task.id, task]));
  const tasksOf = (columnId: string) =>
    (layout[columnId] ?? []).flatMap((id) => visible.get(id) ?? []);
  const openTicket = board.tasks.find((task) => task.id === openId) ?? null;

  if (board.loading && board.columns.length === 0) {
    return <CardGridSkeleton count={3} avatar={false} />;
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={accessibility}
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
            {board.columns.map((column, index) => (
              <BoardColumnCard
                key={column.id}
                column={column}
                index={index}
                columnCount={board.columns.length}
                onMoveColumn={moveColumn}
                tasks={tasksOf(column.id)}
                highlighted={targetColumn === column.id}
                onRename={board.editColumn}
                onToggleDone={board.toggleColumnDone}
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

        <KanbanDragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} grip={overlayGrip} onOpen={() => undefined} />
          ) : null}
        </KanbanDragOverlay>
      </DndContext>

      <TicketDialog
        ticket={openTicket}
        epics={epicOptionsOf(board.tasks, openId ?? '')}
        onClose={() => setOpenId(null)}
        onChanged={board.reload}
        board={{ columns: board.columns, onMove: moveTaskToColumn }}
      />
    </>
  );
}
