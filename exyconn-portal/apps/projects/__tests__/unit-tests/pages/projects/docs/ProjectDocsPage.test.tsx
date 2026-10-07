import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DragEndEvent } from '@dnd-kit/core';
import { ProjectDocsPage } from '../../../../../src/pages/projects/docs';
import { buildDocTree } from '../../../../../src/pages/projects/docs/doc-tree';
import { renderWithProviders } from '../../../test-utils';
import { docPage } from '../../../fixtures';

interface EditorProps {
  pageId: string;
  trail: { title: string }[];
  onSave: unknown;
  onDelete: unknown;
  onCancel: () => void;
}

const state = vi.hoisted(() => ({
  docs: null as unknown,
  projectId: '',
  editor: null as unknown,
  onDragEnd: null as unknown,
}));

vi.mock('../../../../../src/pages/projects/docs/useProjectDocs', () => ({
  useProjectDocs: (projectId: string) => {
    state.projectId = projectId;
    return state.docs;
  },
}));

vi.mock('../../../../../src/pages/projects/docs/DocPageEditor', () => ({
  DocPageEditor: (props: Readonly<EditorProps>) => {
    state.editor = props;
    return (
      <div>
        <p>{`Editor for ${props.pageId}`}</p>
        <button type="button" onClick={props.onCancel}>
          Close editor
        </button>
      </div>
    );
  },
}));

/** The real drag context, with the page's drop handler kept so a test can drop by hand. */
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const real = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...real,
    DndContext: (props: ComponentProps<typeof real.DndContext>) => {
      state.onDragEnd = props.onDragEnd;
      return <real.DndContext {...props} />;
    },
  };
});

const PAGES = [
  docPage('runbooks', null, 'Runbooks'),
  docPage('releasing', 'runbooks', 'Releasing'),
];

function docsApi(overrides: Record<string, unknown> = {}) {
  return {
    loading: false,
    pages: PAGES,
    tree: buildDocTree(PAGES),
    trail: [PAGES[0]],
    selectedId: null,
    setSelectedId: vi.fn(),
    addPage: vi.fn(),
    savePage: vi.fn(),
    removePage: vi.fn(),
    reorderPage: vi.fn(),
    ...overrides,
  };
}

const docs = () => state.docs as ReturnType<typeof docsApi>;
const editor = () => state.editor as EditorProps;
const drop = (activeId: string, overId: string | null) => {
  const over = overId ? { id: overId } : null;
  const event = { active: { id: activeId }, over } as unknown as DragEndEvent;
  act(() => {
    (state.onDragEnd as (dropped: DragEndEvent) => void)(event);
  });
};

const renderPage = () => renderWithProviders(<ProjectDocsPage projectId="proj-1" />);

describe('ProjectDocsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.editor = null;
    state.docs = docsApi();
  });

  it('shows a spinner until the space first loads', () => {
    state.docs = docsApi({ loading: true, pages: [], tree: [] });
    renderPage();

    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
  });

  it('invites the first page into an empty space', async () => {
    state.docs = docsApi({ pages: [], tree: [] });
    renderPage();

    expect(screen.getByText('No pages yet. Start the space with one.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'New page' }));

    expect(docs().addPage).toHaveBeenCalledWith(null);
  });

  it('lists the pages of the project, asking the reader to pick one', () => {
    state.docs = docsApi({ loading: true });
    renderPage();

    expect(state.projectId).toBe('proj-1');
    expect(screen.getByText('Runbooks')).toBeInTheDocument();
    expect(screen.getByText('Releasing')).toBeInTheDocument();
    expect(screen.getByText('Pick a page to read or edit it.')).toBeInTheDocument();
  });

  it('opens a page from the tree and files a new page under another', async () => {
    renderPage();

    await userEvent.click(screen.getByText('Releasing'));
    await userEvent.click(screen.getByRole('button', { name: 'Add a page under Runbooks' }));

    expect(docs().setSelectedId).toHaveBeenCalledWith('releasing');
    expect(docs().addPage).toHaveBeenCalledWith('runbooks');
  });

  it('edits the open page with its trail, and closes it again', async () => {
    state.docs = docsApi({ selectedId: 'runbooks' });
    renderPage();

    expect(screen.getByText('Editor for runbooks')).toBeInTheDocument();
    expect(editor().trail).toBe(docs().trail);
    expect(editor().onSave).toBe(docs().savePage);
    expect(editor().onDelete).toBe(docs().removePage);

    await userEvent.click(screen.getByRole('button', { name: 'Close editor' }));
    expect(docs().setSelectedId).toHaveBeenCalledWith(null);
  });

  it('moves a page dropped on another, and ignores a drop on nothing', () => {
    renderPage();

    drop('releasing', 'runbooks');
    drop('runbooks', null);

    expect(docs().reorderPage).toHaveBeenCalledTimes(1);
    expect(docs().reorderPage).toHaveBeenCalledWith('releasing', 'runbooks');
  });
});
