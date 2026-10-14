import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { fakeEditor } from './workflow-actions.helpers';
import { hooks, resetWorkspaceHooks } from './workspace.stubs';
import { ISSUES, mountWorkspace } from './workspace.setup';

vi.mock('@exyconn/wa-flow', async (importOriginal) => {
  const stubs = await import('./workspace.stubs');
  return { ...(await importOriginal<object>()), validateGraph: () => stubs.hooks.issues };
});
vi.mock('../../../../../src/admin/workflows/editor/EditorHeader', async () => {
  const stubs = await import('./workspace.stubs');
  return { EditorHeader: stubs.HeaderStub };
});
vi.mock('../../../../../src/admin/workflows/editor/EditorSidePanel', async () => {
  const stubs = await import('./workspace.stubs');
  return { EditorSidePanel: stubs.SidePanelStub };
});
vi.mock('../../../../../src/admin/workflows/editor/PhoneEditorChrome', async () => {
  const stubs = await import('./workspace.stubs');
  return { PhoneEditorChrome: stubs.PhoneStub };
});
vi.mock('../../../../../src/admin/workflows/editor/canvas/FlowCanvas', async () => {
  const stubs = await import('./workspace.stubs');
  return { FlowCanvas: stubs.CanvasStub };
});
vi.mock('../../../../../src/admin/workflows/editor/canvas/NodePalette', async () => {
  const stubs = await import('./workspace.stubs');
  return { NodePalette: stubs.PaletteStub };
});
vi.mock('../../../../../src/admin/workflows/editor/panels/PreviewPane', async () => {
  const stubs = await import('./workspace.stubs');
  return { PreviewPane: stubs.PreviewStub };
});
vi.mock('../../../../../src/admin/workflows/editor/panels/ValidationPanel', async () => {
  const stubs = await import('./workspace.stubs');
  return { ValidationPanel: stubs.ValidationStub };
});
vi.mock('../../../../../src/admin/workflows/WorkflowDetailsDialog', async () => {
  const stubs = await import('./workspace.stubs');
  return { WorkflowDetailsDialog: stubs.DialogStub };
});
vi.mock('../../../../../src/admin/workflows/editor/useEditorCommands', async () => {
  const stubs = await import('./workspace.stubs');
  return {
    useEditorCommands: (...args: unknown[]) => {
      stubs.hooks.commandArgs = args;
      return stubs.hooks.commands;
    },
  };
});
vi.mock('../../../../../src/admin/workflows/editor/useWorkflowActions', async () => {
  const stubs = await import('./workspace.stubs');
  return { useWorkflowActions: () => stubs.hooks.actions };
});
vi.mock('../../../../../src/admin/workflows/editor/usePreviewBundle', async () => {
  const stubs = await import('./workspace.stubs');
  return { usePreviewBundle: () => stubs.hooks.bundle };
});
vi.mock('../../../../../src/admin/workflows/editor/useUnloadGuard', async () => {
  const stubs = await import('./workspace.stubs');
  return { useUnloadGuard: stubs.hooks.unloadGuard };
});

const button = (name: string) => screen.getByRole('button', { name });
const url = () => screen.getByRole('status', { name: 'url' });
const LIST = '/admin/bot-workflows?demo=demo-1';

beforeEach(() => {
  resetWorkspaceHooks();
  hooks.issues = ISSUES;
});

describe('EditorWorkspace — leaving the editor', () => {
  it("goes straight back to the demo's workflow list when nothing is unsaved", async () => {
    const { user } = mountWorkspace();
    await user.click(button('Back'));
    expect(url()).toHaveTextContent(LIST);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('warns the browser while there are unsaved edits', () => {
    mountWorkspace({ editor: fakeEditor({ dirty: true }) });
    expect(hooks.unloadGuard).toHaveBeenCalledWith(true);
  });

  it('stays when leaving with unsaved edits is cancelled', async () => {
    const { user } = mountWorkspace({ editor: fakeEditor({ dirty: true }) });
    await user.click(button('Back'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Leave without saving?');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('status', { name: 'url' })).toHaveTextContent(
      '/admin/bot-workflows/wf-1',
    );
  });

  it('leaves once losing the unsaved edits is confirmed', async () => {
    const { user } = mountWorkspace({ editor: fakeEditor({ dirty: true }) });
    await user.click(button('Back'));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Leave' }));
    expect(await screen.findByText(LIST)).toBeInTheDocument();
  });
});

describe('EditorWorkspace — workflow details', () => {
  it('edits the working details in a dialog and keeps the answer as unsaved', async () => {
    const { user, editor } = mountWorkspace();
    expect(screen.queryByRole('region', { name: 'details dialog' })).not.toBeInTheDocument();
    await user.click(button('Details'));
    expect(screen.getByText('Details of book-visit: Edited name')).toBeInTheDocument();
    await user.click(button('Save details'));
    expect(editor.setMeta).toHaveBeenCalledWith({
      name: 'New name',
      description: 'Edited',
      keywords: ['a'],
      order: 4,
    });
    expect(screen.queryByRole('region', { name: 'details dialog' })).not.toBeInTheDocument();
  });

  it('starts from the stored details before the editor has its own', async () => {
    const { user } = mountWorkspace({ editor: fakeEditor({ meta: null }) });
    await user.click(button('Details'));
    expect(screen.getByText('Details of book-visit: Book a visit')).toBeInTheDocument();
    await user.click(button('Close details'));
    expect(screen.queryByRole('region', { name: 'details dialog' })).not.toBeInTheDocument();
  });
});
