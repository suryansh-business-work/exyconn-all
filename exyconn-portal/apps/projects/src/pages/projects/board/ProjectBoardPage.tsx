import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Box, Button, CircularProgress, Flex, Heading } from '@exyconn/shell/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGetProjectQuery } from '@exyconn/shell/graphql/generated';
import { useProjectBoard } from './useProjectBoard';
import { useBoardDnd } from './useBoardDnd';
import { BoardColumnCard } from './BoardColumnCard';
import { TaskCard } from './TaskCard';
import { AddItemInput } from './AddItemInput';

/** Per-project kanban board with drag-and-drop columns and tasks. */
export function ProjectBoardPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data } = useGetProjectQuery({ variables: { id }, skip: !id });
  const board = useProjectBoard(id);
  const { sensors, activeTask, onDragStart, onDragEnd } = useBoardDnd(board);

  const tasksOf = (columnId: string) => board.tasks.filter((t) => t.columnId === columnId);

  return (
    <Flex direction="column" sx={{ height: '100%', minHeight: 0 }}>
      <Flex direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          size="small"
        >
          Projects
        </Button>
        <Heading level={5}>{data?.getProject.name ?? 'Board'}</Heading>
      </Flex>

      {board.loading && board.columns.length === 0 ? (
        <Box sx={{ display: 'grid', placeItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : (
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
                  onDeleteTask={board.removeTask}
                />
              ))}
            </SortableContext>

            <Box sx={{ width: 280, flexShrink: 0 }}>
              <AddItemInput label="Add column" placeholder="Column name" onAdd={board.addColumn} />
            </Box>
          </Flex>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} onDelete={() => undefined} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </Flex>
  );
}
