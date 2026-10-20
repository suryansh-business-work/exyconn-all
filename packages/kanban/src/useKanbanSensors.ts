import { KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

/**
 * A board's sensors. A pointer drags after a few pixels, so a click still opens a card. A
 * finger has to hold before it drags: the board scrolls sideways under it, and a pointer
 * sensor alone reads the first flick of that scroll as picking a card up. Space or Enter on a
 * grip picks it up, the arrow keys carry it, Space or Enter drops it.
 */
export function useKanbanSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}
