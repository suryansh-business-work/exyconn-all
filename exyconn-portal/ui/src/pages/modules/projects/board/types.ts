/** View models for the project kanban board. */
export interface ColumnView {
  id: string;
  name: string;
}

export interface TaskView {
  id: string;
  columnId: string;
  title: string;
  description?: string | null;
}

export type DragType = 'column' | 'task';
