import type { ReactNode } from 'react';
import { vi } from 'vitest';
import type { GraphIssue, NodeType, WaNode } from '@exyconn/wa-flow';

/** Stand-ins for the editor's parts, recording the props EditorWorkspace hands each one. */
export const seen: Record<string, unknown> = {};

/** What the mocked hooks return; reset per test with `resetWorkspaceHooks`. */
export const hooks = {
  commands: {
    add: vi.fn(),
    focus: vi.fn(),
    tidy: vi.fn(),
    apply: vi.fn(),
    makeStart: vi.fn(),
    remove: vi.fn(),
  },
  commandArgs: [] as unknown[],
  actions: {
    busy: false,
    saving: false,
    publishing: false,
    onSave: vi.fn(),
    onPublish: vi.fn(),
    onDiscard: vi.fn(),
  },
  bundle: null as unknown,
  unloadGuard: vi.fn(),
  issues: [] as GraphIssue[],
};

export function resetWorkspaceHooks() {
  for (const command of Object.values(hooks.commands)) {
    command.mockReset();
  }
  hooks.commands.remove.mockResolvedValue(undefined);
  hooks.actions.busy = false;
  for (const action of [hooks.actions.onSave, hooks.actions.onPublish, hooks.actions.onDiscard]) {
    action.mockReset().mockResolvedValue(undefined);
  }
  hooks.commandArgs = [];
  hooks.bundle = null;
  hooks.unloadGuard.mockReset();
  hooks.issues = [];
  for (const key of Object.keys(seen)) {
    delete seen[key];
  }
}

type Handler = () => void;

interface HeaderProps {
  name: string;
  errors: number;
  busy: boolean;
  onBack: Handler;
  onDetails: Handler;
  onTidy: Handler;
  onPreview: Handler;
  onDiscard: Handler;
  onSave: Handler;
  onPublish: Handler;
}

export function HeaderStub(props: Readonly<HeaderProps>) {
  seen.header = props;
  const actions: [string, Handler][] = [
    ['Back', props.onBack],
    ['Details', props.onDetails],
    ['Tidy', props.onTidy],
    ['Preview', props.onPreview],
    ['Discard', props.onDiscard],
    ['Save', props.onSave],
    ['Publish', props.onPublish],
  ];
  return (
    <header>
      <h1>{props.name}</h1>
      {actions.map(([label, onClick]) => (
        <button key={label} type="button" onClick={onClick}>
          {label}
        </button>
      ))}
    </header>
  );
}

interface SideProps {
  selected: WaNode | undefined;
  isStart: boolean;
  showProblems: boolean;
  onDelete: Handler;
  onClose: Handler;
}

export function SidePanelStub(props: Readonly<SideProps>) {
  seen.side = props;
  return (
    <section aria-label="side panel">
      <p>{`Selected ${props.selected?.id ?? 'none'}${props.isStart ? ' (start)' : ''}`}</p>
      <button type="button" onClick={props.onDelete}>
        Delete node
      </button>
      <button type="button" onClick={props.onClose}>
        Close node
      </button>
    </section>
  );
}

export function CanvasStub(props: Readonly<Record<string, unknown>>) {
  seen.canvas = props;
  return <p>Canvas</p>;
}

export function PaletteStub({ onAdd }: Readonly<{ onAdd: (type: NodeType) => void }>) {
  return (
    <button type="button" onClick={() => onAdd('text')}>
      Palette add
    </button>
  );
}

export function PreviewStub({
  startWorkflow,
  onClose,
}: Readonly<{ startWorkflow: string; onClose: Handler }>) {
  return (
    <section aria-label="preview">
      <p>{`Previewing ${startWorkflow}`}</p>
      <button type="button" onClick={onClose}>
        Close preview
      </button>
    </section>
  );
}

export function ValidationStub({ issues }: Readonly<{ issues: readonly GraphIssue[] }>) {
  return <p>{`${issues.length} problems listed`}</p>;
}

interface DialogProps {
  open: boolean;
  initial: { key: string; name: string; description: string; keywords: string[]; order: number };
  onSubmit: (values: DialogProps['initial']) => void;
  onClose: Handler;
}

export function DialogStub(props: Readonly<DialogProps>) {
  seen.dialog = props;
  if (!props.open) {
    return null;
  }
  return (
    <section aria-label="details dialog">
      <p>{`Details of ${props.initial.key}: ${props.initial.name}`}</p>
      <button
        type="button"
        onClick={() => props.onSubmit({ ...props.initial, name: 'New name', keywords: ['a'] })}
      >
        Save details
      </button>
      <button type="button" onClick={props.onClose}>
        Close details
      </button>
    </section>
  );
}

interface PhoneProps {
  inspector: ReactNode;
  problems: ReactNode;
  preview: ReactNode;
  onCloseInspector: Handler;
  onClosePreview: Handler;
}

export function PhoneStub(props: Readonly<PhoneProps>) {
  seen.phone = props;
  return (
    <div>
      {props.inspector}
      {props.problems}
      {props.preview}
      <button type="button" onClick={props.onCloseInspector}>
        Phone close inspector
      </button>
      <button type="button" onClick={props.onClosePreview}>
        Phone close preview
      </button>
    </div>
  );
}
