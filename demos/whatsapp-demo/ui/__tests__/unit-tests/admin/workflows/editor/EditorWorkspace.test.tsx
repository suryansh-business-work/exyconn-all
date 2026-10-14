import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { fakeEditor } from './workflow-actions.helpers';
import { hooks, resetWorkspaceHooks, seen } from './workspace.stubs';
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

const consoleError = vi.spyOn(console, 'error');
const button = (name: string) => screen.getByRole('button', { name });

beforeEach(() => {
  resetWorkspaceHooks();
  hooks.issues = ISSUES;
  consoleError.mockImplementation(() => undefined);
});
afterEach(() => {
  consoleError.mockReset();
});

describe('EditorWorkspace — desktop layout', () => {
  it('lays out the header, palette, canvas and side panel from the working copy', () => {
    const { editor } = mountWorkspace();
    expect(screen.getByRole('heading', { name: 'Edited name' })).toBeInTheDocument();
    expect(seen.header).toMatchObject({ errors: 2, busy: false });
    const canvas = seen.canvas as Record<string, unknown>;
    expect(canvas.graph).toBe(editor.graph);
    expect(canvas.workflowKeys).toEqual(['book-visit', 'faq']);
    expect(canvas.onChange).toBe(editor.update);
    expect(canvas.onSelect).toBe(editor.select);
    const view = canvas.view as {
      selectedId: string;
      issues: Map<string, unknown>;
      aiConfigured: boolean;
    };
    expect(view.selectedId).toBe('text-1');
    expect(view.issues.get('text-1')).toEqual({ errors: 1, warnings: 0 });
    expect(view.aiConfigured).toBe(true);
    expect(seen.side).toMatchObject({ showProblems: true, isStart: false });
    expect(screen.getByText('Selected text-1')).toBeInTheDocument();
    expect(hooks.commandArgs.slice(0, 2)).toEqual([editor, ['book-visit', 'faq']]);
    expect(hooks.unloadGuard).toHaveBeenCalledWith(false);
    expect(screen.queryByText(/problems listed/)).not.toBeInTheDocument();
  });

  it("uses the stored name and the workflow's own key until the rest loads", () => {
    mountWorkspace({ editor: fakeEditor({ meta: null, selectedId: null }), siblings: undefined });
    expect(screen.getByRole('heading', { name: 'Book a visit' })).toBeInTheDocument();
    expect((seen.canvas as { workflowKeys: string[] }).workflowKeys).toEqual(['book-visit']);
    expect(screen.getByText('Selected none')).toBeInTheDocument();
  });

  it('marks the start node in the side panel', () => {
    mountWorkspace({ editor: fakeEditor({ selectedId: 'end-2' }) });
    expect(screen.getByText('Selected end-2 (start)')).toBeInTheDocument();
  });

  it('wires the palette, the side panel and the header to the commands and actions', async () => {
    const { user, editor } = mountWorkspace();
    await user.click(button('Palette add'));
    expect(hooks.commands.add).toHaveBeenCalledWith('text');
    await user.click(button('Delete node'));
    expect(hooks.commands.remove).toHaveBeenCalledTimes(1);
    await user.click(button('Close node'));
    expect(editor.select).toHaveBeenCalledWith(null);
    await user.click(button('Tidy'));
    expect(hooks.commands.tidy).toHaveBeenCalledTimes(1);
    for (const name of ['Save', 'Publish', 'Discard']) {
      await user.click(button(name));
    }
    expect(hooks.actions.onSave).toHaveBeenCalledTimes(1);
    expect(hooks.actions.onPublish).toHaveBeenCalledTimes(1);
    expect(hooks.actions.onDiscard).toHaveBeenCalledTimes(1);
  });

  it('logs an action that failed without handling it', async () => {
    const failure = new Error('Unexpected');
    hooks.actions.onSave.mockRejectedValue(failure);
    const { user } = mountWorkspace();
    await user.click(button('Save'));
    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith('Workflow editor action failed', failure),
    );
  });

  it('swaps the side panel for the preview and back', async () => {
    hooks.bundle = { demo: {}, workflows: [] };
    const { user } = mountWorkspace();
    await user.click(button('Preview'));
    expect(screen.getByText('Previewing book-visit')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'side panel' })).not.toBeInTheDocument();
    await user.click(button('Close preview'));
    expect(screen.getByRole('region', { name: 'side panel' })).toBeInTheDocument();
  });

  it('keeps the side panel while there is nothing to preview', async () => {
    const { user } = mountWorkspace();
    await user.click(button('Preview'));
    expect(screen.getByRole('region', { name: 'side panel' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'preview' })).not.toBeInTheDocument();
  });
});
