import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LiveEditor,
  cmsBlocks,
  cmsEditorPlugin,
  type CmsEditRequest,
  type LiveDesign,
  type LiveEditorHandle,
  type LiveEditorProps,
} from '@exyconn/live-editor';
import { Box, useMediaQuery, useTheme } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { NeedsBiggerScreen } from '../../website/live-edit/NeedsBiggerScreen';
import { useUnloadGuard } from '../../website/live-edit/useUnloadGuard';
import { useMediaUpload } from '../media';
import { useCurrentSite } from '../site';
import { BuilderToolbar, type BuilderToolbarProps } from './BuilderToolbar';
import { PropsDrawer } from './PropsDrawer';
import { LivePreviewPane } from './LivePreviewPane';
import type { BuilderResources } from './useBuilderResources';
import { useBuilderSave, type BuilderPersistence } from './useBuilderSave';

type ToolbarExtras = Pick<BuilderToolbarProps, 'onSettings' | 'onRevisions'>;

interface BuilderScreenProps extends ToolbarExtras, BuilderPersistence {
  title: string;
  caption: string;
  status: string;
  backPath: string;
  initial: LiveDesign;
  projectData: unknown;
  resources: BuilderResources;
  /** Opens the saved draft on the website; `saveFirst` saves unsaved work before it loads. */
  onPreview?: (saveFirst: () => Promise<unknown>) => void;
  /** The saved draft's address on the website, for the live preview beside the canvas. */
  loadPreviewUrl?: () => Promise<string>;
  /** Drawers the page adds (settings, revisions). */
  children?: ReactNode;
}

/**
 * The full-screen page builder: GrapesJS with the site's blocks, components and fragments on a
 * canvas wearing the site's design system, with save, publish, autosave and a guarded exit.
 */
export function BuilderScreen(props: Readonly<BuilderScreenProps>) {
  const { site } = useCurrentSite();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const notify = useNotify();
  const editor = useRef<LiveEditorHandle>(null);
  const [editing, setEditing] = useState<CmsEditRequest | null>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  // Bumped after every successful save, so the live preview shows what was just saved.
  const [savedVersion, setSavedVersion] = useState(0);
  const uploadImage = useMediaUpload(site.id);
  const builder = useBuilderSave(editor, props);
  useUnloadGuard(builder.dirty);
  const theme = useTheme();
  const small = useMediaQuery(theme.breakpoints.down('md'));
  const { resources } = props;

  // GrapesJS reads these once, at mount.
  const setup = useMemo(
    () => ({
      blocks: cmsBlocks(resources.components, resources.fragments),
      plugins: [
        cmsEditorPlugin({
          components: resources.components,
          fragments: resources.fragments,
          onEditComponent: setEditing,
        }),
      ],
    }),
    [resources],
  );

  const back = async () => {
    const leave =
      !builder.dirty ||
      (await confirm({
        title: 'Leave without saving?',
        message: 'Your changes have not been saved and will be lost.',
        confirmText: 'Leave',
        destructive: true,
      }));
    if (leave) navigate(props.backPath);
  };
  const report = (fallback: string) => (error: unknown) =>
    notify(errorMessage(error, fallback), 'error');

  const { onPreview } = props;
  const preview = onPreview
    ? () => onPreview(() => (builder.dirty ? builder.save(true) : Promise.resolve(true)))
    : undefined;

  if (small) {
    return <NeedsBiggerScreen onBack={() => navigate(props.backPath)} />;
  }
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (t) => t.zIndex.drawer + 2,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <BuilderToolbar
        title={props.title}
        caption={props.caption}
        status={props.status}
        dirty={builder.dirty}
        saving={builder.saving}
        publishing={builder.publishing}
        onBack={() => back().catch(report('Could not go back'))}
        onSave={() =>
          builder
            .save()
            .then((saved) => saved && setSavedVersion((value) => value + 1))
            .catch(report('Could not save'))
        }
        onPublish={() => builder.publish().catch(report('Could not publish'))}
        onPreview={preview}
        liveOpen={liveOpen}
        onToggleLive={props.loadPreviewUrl ? () => setLiveOpen((open) => !open) : undefined}
        onSettings={props.onSettings}
        onRevisions={props.onRevisions}
      />
      <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex' }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <LiveEditor
            ref={editor}
            initial={props.initial}
            projectData={(props.projectData ?? null) as LiveEditorProps['projectData']}
            canvasStyles={resources.canvasStyles}
            canvasClass="cms-page"
            canvasCss={resources.canvasCss}
            blocks={setup.blocks}
            plugins={setup.plugins}
            assets={resources.assets}
            uploadImage={uploadImage}
            onError={(message) => notify(message, 'error')}
            onDirty={builder.markDirty}
          />
        </Box>
        {liveOpen && props.loadPreviewUrl && (
          <Box sx={{ width: '45%', flexShrink: 0 }}>
            <LivePreviewPane loadUrl={props.loadPreviewUrl} version={savedVersion} />
          </Box>
        )}
      </Box>
      <PropsDrawer request={editing} siteId={site.id} onClose={() => setEditing(null)} />
      {props.children}
    </Box>
  );
}
