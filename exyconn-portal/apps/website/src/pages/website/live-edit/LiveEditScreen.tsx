import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveEditor, type LiveDesign, type LiveEditorHandle } from '@exyconn/live-editor';
import { Box } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useImageKitUpload } from '@exyconn/shell/hooks/useImageKitUpload';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { LiveEditToolbar } from './LiveEditToolbar';
import { ARTICLE_CANVAS_STYLES, ARTICLE_CLASS } from './live-edit.config';

interface LiveEditScreenProps {
  title: string;
  /** Public URL of the detail page, for "View on site". */
  pageUrl: string;
  /** The list this screen returns to. */
  backPath: string;
  /** ImageKit folder for images uploaded from the canvas. */
  folder: string;
  initial: LiveDesign;
  onSave: (design: LiveDesign) => Promise<unknown>;
}

/** Warns before the tab closes or reloads while there is unsaved work. */
function useUnloadGuard(active: boolean) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    globalThis.addEventListener('beforeunload', warn);
    return () => globalThis.removeEventListener('beforeunload', warn);
  }, [active]);
}

/**
 * Full-screen live editor for one article body: the GrapesJS canvas styled by the
 * website's own article stylesheet, with save, view-on-site and a guarded way back.
 */
export function LiveEditScreen({
  title,
  pageUrl,
  backPath,
  folder,
  initial,
  onSave,
}: Readonly<LiveEditScreenProps>) {
  const editor = useRef<LiveEditorHandle>(null);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const notify = useNotify();
  const uploadImage = useImageKitUpload(folder);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useUnloadGuard(dirty);

  const save = async () => {
    if (!editor.current) {
      return;
    }
    setSaving(true);
    try {
      await onSave(editor.current.getDesign());
      setDirty(false);
      notify('Saved — the page shows the new design now');
    } catch (error) {
      notify(errorMessage(error, 'Could not save the design'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const back = async () => {
    const leave =
      !dirty ||
      (await confirm({
        title: 'Leave without saving?',
        message: 'Your changes to this page have not been saved and will be lost.',
        confirmText: 'Leave',
      }));
    if (leave) {
      navigate(backPath);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (theme) => theme.zIndex.drawer + 2,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <LiveEditToolbar
        title={title}
        pageUrl={pageUrl}
        dirty={dirty}
        saving={saving}
        onBack={() => {
          back().catch((error: unknown) =>
            notify(errorMessage(error, 'Could not go back'), 'error'),
          );
        }}
        onSave={() => {
          save().catch((error: unknown) => notify(errorMessage(error, 'Could not save'), 'error'));
        }}
      />
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <LiveEditor
          ref={editor}
          initial={initial}
          canvasStyles={ARTICLE_CANVAS_STYLES}
          canvasClass={ARTICLE_CLASS}
          uploadImage={uploadImage}
          onError={(message) => notify(message, 'error')}
          onDirty={() => setDirty(true)}
        />
      </Box>
    </Box>
  );
}
