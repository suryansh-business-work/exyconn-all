import type { Editor } from '@tiptap/core';
import { ToolbarButton } from './ToolbarButton';
import type { ToolbarAction } from './toolbar.config';

interface ActionGroupProps {
  editor: Editor;
  actions: readonly ToolbarAction[];
  active: Record<string, boolean>;
  disabled: boolean;
}

/** Renders a run of toolbar actions from their declarative specs. */
export function ActionGroup({ editor, actions, active, disabled }: Readonly<ActionGroupProps>) {
  return actions.map(({ key, label, icon: Icon, run, isActive }) => (
    <ToolbarButton
      key={key}
      label={label}
      active={isActive ? active[key] : undefined}
      disabled={disabled}
      onClick={() => run(editor)}
    >
      <Icon fontSize="small" />
    </ToolbarButton>
  ));
}
