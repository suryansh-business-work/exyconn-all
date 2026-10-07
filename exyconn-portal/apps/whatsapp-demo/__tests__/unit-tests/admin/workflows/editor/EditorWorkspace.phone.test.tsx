import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
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

interface PhoneSeen {
  errors: number;
  inspectorOpen: boolean;
  previewOpen: boolean;
  onAdd: unknown;
}

const phone = () => seen.phone as PhoneSeen;
const button = (name: string) => screen.getByRole('button', { name });

beforeEach(() => {
  resetWorkspaceHooks();
  hooks.issues = ISSUES;
  // A phone: every width query matches.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('EditorWorkspace — phone layout', () => {
  it('moves the palette, the problems and the inspector into the phone drawers', () => {
    mountWorkspace();
    expect(screen.queryByRole('button', { name: 'Palette add' })).not.toBeInTheDocument();
    expect(phone()).toMatchObject({ errors: 2, inspectorOpen: true, previewOpen: false });
    expect(phone().onAdd).toBe(hooks.commands.add);
    expect(seen.side).toMatchObject({ showProblems: false });
    expect(screen.getByText('3 problems listed')).toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: 'side panel' })).toHaveLength(1);
  });

  it('keeps the inspector drawer shut while no node is selected', () => {
    mountWorkspace({ editor: fakeEditor({ selectedId: null }) });
    expect(phone().inspectorOpen).toBe(false);
  });

  it('closes the inspector by clearing the selection', async () => {
    const { user, editor } = mountWorkspace();
    await user.click(button('Phone close inspector'));
    expect(editor.select).toHaveBeenCalledWith(null);
  });

  it('opens the preview full screen and closes it again', async () => {
    hooks.bundle = { demo: {}, workflows: [] };
    const { user } = mountWorkspace();
    expect(screen.getByText('Previewing book-visit')).toBeInTheDocument();
    await user.click(button('Preview'));
    expect(phone().previewOpen).toBe(true);
    await user.click(button('Phone close preview'));
    expect(phone().previewOpen).toBe(false);
  });

  it('has no preview to show before the demo is known', () => {
    mountWorkspace();
    expect(screen.queryByRole('region', { name: 'preview' })).not.toBeInTheDocument();
  });
});
