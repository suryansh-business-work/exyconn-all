import type { Editor } from 'grapesjs';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { iconMarkup } from '../icon-markup';

/** Adds Undo and Redo to the canvas toolbar (GrapesJS keeps the history; Ctrl+Z works too). */
export function addHistoryButtons(editor: Editor): void {
  editor.Panels.addButton('options', {
    id: 'exy-undo',
    label: iconMarkup(UndoIcon, 18),
    togglable: false,
    attributes: { title: 'Undo' },
    command: 'core:undo',
  });
  editor.Panels.addButton('options', {
    id: 'exy-redo',
    label: iconMarkup(RedoIcon, 18),
    togglable: false,
    attributes: { title: 'Redo' },
    command: 'core:redo',
  });
}
