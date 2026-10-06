import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { compileHtml } from '@exyconn/cms';
import type { LiveEditorHandle } from '@exyconn/live-editor';
import type { CmsDraftInput } from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/** How often unsaved work is saved as a draft without being asked. */
const AUTOSAVE_MS = 30_000;

export interface BuilderPersistence {
  saveDraft: (draft: CmsDraftInput) => Promise<unknown>;
  publish: () => Promise<unknown>;
}

/**
 * Reads the canvas as a draft: the GrapesJS project (to reopen it), its HTML and CSS. The
 * HTML is compiled here first, exactly as the server will on publish, so a broken
 * placeholder is reported at save time instead of reaching the database.
 */
function readDraft(editor: LiveEditorHandle): CmsDraftInput {
  const design = editor.getDesign();
  compileHtml(design.html, design.css);
  return { projectData: editor.getProjectData(), html: design.html, css: design.css };
}

/** Save draft, publish, autosave and the "unsaved changes" state of a builder. */
export function useBuilderSave(
  editor: RefObject<LiveEditorHandle | null>,
  persistence: BuilderPersistence,
) {
  const notify = useNotify();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  // Bumped on every edit, so an edit made while a save is in flight keeps the page dirty.
  const version = useRef(0);
  const busy = useRef(false);
  const latest = useRef(persistence);
  latest.current = persistence;

  const markDirty = useCallback(() => {
    version.current += 1;
    setDirty(true);
  }, []);

  const save = useCallback(
    async (silent = false): Promise<boolean> => {
      if (!editor.current || busy.current) return false;
      busy.current = true;
      setSaving(true);
      const started = version.current;
      try {
        await latest.current.saveDraft(readDraft(editor.current));
        if (version.current === started) setDirty(false);
        if (!silent) notify('Draft saved');
        return true;
      } catch (error) {
        notify(errorMessage(error, 'Could not save the draft'), 'error');
        return false;
      } finally {
        busy.current = false;
        setSaving(false);
      }
    },
    [editor, notify],
  );

  const publish = useCallback(async () => {
    if (dirty && !(await save(true))) return;
    setPublishing(true);
    try {
      await latest.current.publish();
      notify('Published — the site shows this version now', 'success');
    } catch (error) {
      notify(errorMessage(error, 'Could not publish'), 'error');
    } finally {
      setPublishing(false);
    }
  }, [dirty, save, notify]);

  useEffect(() => {
    if (!dirty) return undefined;
    const timer = globalThis.setInterval(() => {
      save(true).catch((error: unknown) => notify(errorMessage(error, 'Autosave failed'), 'error'));
    }, AUTOSAVE_MS);
    return () => globalThis.clearInterval(timer);
  }, [dirty, save, notify]);

  return { dirty, saving, publishing, markDirty, save, publish };
}
