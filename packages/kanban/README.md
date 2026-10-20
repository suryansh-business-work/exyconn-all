# @exyconn/kanban

The drag-and-drop board shared by CRM deals and project tickets, on dnd-kit.

Every board gets the same drag: a card is picked up by its grip, a copy follows
the pointer on a raised shadow, its slot stays behind as a dashed placeholder
that moves into whichever column the card is over, and that column wears a
ring. The keyboard (Space, arrows, Space) does the same.

## Use it

Lay the board out as item ids per column, then let `useKanbanDnd` preview the
drag and hand you the drop:

```tsx
import {
  KanbanDragOverlay,
  SortableKanbanItem,
  arrangeBoard,
  dropTargetRing,
  useKanbanDnd,
  useKanbanSensors,
} from '@exyconn/kanban';

const settled = arrangeBoard(
  tasks.map((task) => ({ id: task.id, column: task.columnId })),
  columns.map((column) => column.id),
);
const drag = useKanbanDnd({
  layout: settled,
  onDrop: (id, target, from) => moveTask(id, target.column, target.index),
});

<DndContext
  sensors={useKanbanSensors()}
  collisionDetection={closestCorners}
  onDragStart={drag.onDragStart}
  onDragOver={drag.onDragOver}
  onDragEnd={drag.onDragEnd}
  onDragCancel={drag.onDragCancel}
>
  {columns.map((column) => (
    <Box key={column.id} sx={[panel, drag.targetColumn === column.id && dropTargetRing()]}>
      <SortableContext items={drag.layout[column.id]} strategy={verticalListSortingStrategy}>
        {drag.layout[column.id].map((id) => (
          <SortableKanbanItem key={id} id={id} column={column.id} dragLabel={t('Drag {key}', …)}>
            {(grip) => <TaskCard task={byId.get(id)} grip={grip} />}
          </SortableKanbanItem>
        ))}
      </SortableContext>
    </Box>
  ))}
  <KanbanDragOverlay>
    {activeTask ? <TaskCard task={activeTask} grip={overlayGrip} /> : null}
  </KanbanDragOverlay>
</DndContext>;
```

Render the columns from `drag.layout`, not from your own data: while a card is
carried it is the preview, with the card already in the slot it would land in.

## What is in it

| Export                                               | What it does                                                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `arrangeBoard`                                       | Lays items out per column, keeping an arranged order and a pending (in-flight) move.                                                      |
| `dropTarget`, `moveItem`, `columnOf`, `dropPosition` | Where a drop lands, the layout after it, an item's column, and the slot in words a screen reader says.                                    |
| `useKanbanDnd`                                       | The drag state and handlers. Only cards on the board are handled; a drag of anything else (a column) is left to the board's own handlers. |
| `useKanbanSensors`                                   | Pointer (after 6px), a held finger (200ms, so the board can scroll sideways) and the keyboard.                                            |
| `SortableKanbanItem`                                 | A sortable slot that becomes the dashed placeholder while carried. The card decides where its grip goes.                                  |
| `KanbanDragOverlay`, `overlayGrip`                   | The lifted, inert copy on the xl shadow, and a picture of the grip for it.                                                                |
| `dropTargetRing`                                     | The target column's ring, in its own accent or the primary colour.                                                                        |

Announcements stay with each board, since they speak its own words (stages,
tickets); `dropPosition` gives them the slot and count.
