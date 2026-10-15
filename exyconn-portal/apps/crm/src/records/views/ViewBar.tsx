import { useState } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Chip, Flex } from '@exyconn/shell/components/ui';
import type { CrmObject } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { CrmViewRow } from '../list/recordQuery';
import type { RecordQuery } from '../list/useRecordQuery';
import { SaveViewForm } from './save-view';
import { useViewActions } from './useViewActions';
import { ViewChip } from './ViewChip';
import { ViewMenu } from './ViewMenu';

/** Who a shared view belongs to: empty for the viewer's own; nothing for a private view. */
function sharedBy(view: CrmViewRow): string | undefined {
  if (!view.shared) {
    return undefined;
  }
  return view.mine ? '' : view.ownerName;
}

interface ViewBarProps {
  object: CrmObject;
  list: RecordQuery;
  /** The default view's name, e.g. "All leads". */
  allLabel: string;
}

/**
 * The row of saved views over a list: the default "All …" view, then the viewer's own and the
 * team's shared views. The open view is in the URL, so a link opens on it. Changes to the
 * filters, sort or columns are "unsaved" until saved over the view (the viewer's own) or as a
 * new one.
 */
export function ViewBar({ object, list, allLabel }: Readonly<ViewBarProps>) {
  const t = useT();
  const actions = useViewActions(object, list);
  const [savingNew, setSavingNew] = useState(false);
  const { views, selectedView, viewId, dirty, chooseView } = list;
  const canSaveOver = dirty && Boolean(selectedView?.mine);
  const saveView = () => {
    if (canSaveOver) {
      actions
        .saveOver()
        .catch((error: unknown) => portalLogger.error('Saving a view failed', error));
    } else {
      setSavingNew(true);
    }
  };

  return (
    <Flex direction="column" spacing={1}>
      {list.viewsError && (
        <Alert severity="error">{t('Could not load the saved views. Try again shortly.')}</Alert>
      )}
      <Flex
        direction="row"
        wrap
        spacing={1}
        alignItems="center"
        role="group"
        aria-label={t('Saved views')}
        // A phone scrolls the views sideways rather than stacking them five rows deep.
        sx={{
          flexWrap: { xs: 'nowrap', sm: 'wrap' },
          overflowX: 'auto',
          pb: 0.5,
          '& > *': { flexShrink: 0 },
        }}
      >
        <ViewChip label={t(allLabel)} selected={viewId === ''} onClick={() => chooseView('')} />
        {views.map((view) => (
          <ViewChip
            key={view.id}
            label={view.name}
            selected={view.id === viewId}
            onClick={() => chooseView(view.id)}
            sharedBy={sharedBy(view)}
          />
        ))}
        {selectedView?.mine && <ViewMenu view={selectedView} actions={actions} />}
        {dirty && (
          <Chip size="small" variant="outlined" color="warning" label={t('Unsaved changes')} />
        )}
        {dirty && (
          <Button size="small" startIcon={<SaveIcon />} onClick={saveView} disabled={actions.busy}>
            {t('Save view')}
          </Button>
        )}
        <Button size="small" onClick={() => setSavingNew(true)} disabled={actions.busy}>
          {t('Save as new view')}
        </Button>
      </Flex>
      {savingNew && (
        <SaveViewForm
          title="Save as new view"
          initial={{ name: '', shared: false }}
          onSubmit={actions.saveAsNew}
          onClose={() => setSavingNew(false)}
        />
      )}
    </Flex>
  );
}
