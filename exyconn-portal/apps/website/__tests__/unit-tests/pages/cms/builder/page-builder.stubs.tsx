import { useEffect, type ReactNode } from 'react';
import { vi } from 'vitest';

/** The BuilderScreen props the page builder hands over. */
export interface ScreenProps {
  title: string;
  caption: string;
  status: string;
  backPath: string;
  initial: { html: string; css: string };
  projectData: unknown;
  saveDraft: (draft: unknown) => Promise<unknown>;
  publish: () => Promise<unknown>;
  onPreview: (saveFirst: () => Promise<unknown>) => void;
  loadPreviewUrl: () => Promise<string>;
  onSettings: () => void;
  onRevisions: () => void;
  children: ReactNode;
}

/** What the stand-ins saw, and the page's doubles. */
export const pageBuilder = {
  screen: null as ScreenProps | null,
  mounts: 0,
  preview: vi.fn(),
  previewUrl: vi.fn(),
};

/** Stands in for the full-screen builder: records its props and renders the page's drawers. */
export function BuilderScreenStub(props: Readonly<ScreenProps>) {
  pageBuilder.screen = props;
  useEffect(() => {
    pageBuilder.mounts += 1;
  }, []);
  return (
    <div>
      <p>{`Builder for ${props.title}`}</p>
      <button type="button" onClick={props.onSettings}>
        Open settings
      </button>
      <button type="button" onClick={props.onRevisions}>
        Open revisions
      </button>
      {props.children}
    </div>
  );
}

/** Stands in for the page settings form: names the page and offers cancel and done. */
function SettingsEditorStub(
  props: Readonly<{ siteId: string; pageId: string; onCancel: () => void; onDone: () => void }>,
) {
  return (
    <div>
      <p>{`Settings of ${props.pageId} on ${props.siteId}`}</p>
      <button type="button" onClick={props.onCancel}>
        Cancel settings
      </button>
      <button type="button" onClick={props.onDone}>
        Save settings
      </button>
    </div>
  );
}

/** Stands in for the revisions drawer: names the page it lists and offers close and restore. */
function RevisionsDrawerStub(
  props: Readonly<{ pageId: string | null; onClose: () => void; onRestored: () => void }>,
) {
  if (!props.pageId) return <p>Revisions closed</p>;
  return (
    <div>
      <p>{`Revisions of ${props.pageId}`}</p>
      <button type="button" onClick={props.onClose}>
        Close revisions
      </button>
      <button type="button" onClick={props.onRestored}>
        Restore revision
      </button>
    </div>
  );
}

/** The `../pages` module as the page builder uses it. */
export function pagesModule() {
  return {
    PageSettingsEditor: SettingsEditorStub,
    PageRevisionsDrawer: RevisionsDrawerStub,
    usePreviewPage: () => pageBuilder.preview,
    usePreviewUrl: () => pageBuilder.previewUrl,
  };
}

/** Reads the recorded screen props, failing when the builder never mounted. */
export function screenProps(): ScreenProps {
  if (!pageBuilder.screen) throw new Error('BuilderScreen was not rendered');
  return pageBuilder.screen;
}
