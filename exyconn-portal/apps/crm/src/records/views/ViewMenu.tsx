import { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useT } from '@exyconn/i18n';
import { IconButton, Menu, MenuItem } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { CrmViewRow } from '../list/recordQuery';
import { SaveViewForm } from './save-view';
import type { ViewActions } from './useViewActions';

interface ViewMenuProps {
  /** One of the viewer's own views. */
  view: CrmViewRow;
  actions: ViewActions;
}

/** Rename, share or stop sharing, and delete — for the viewer's own open view. */
export function ViewMenu({ view, actions }: Readonly<ViewMenuProps>) {
  const t = useT();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [editing, setEditing] = useState(false);
  const close = () => setAnchor(null);
  const shareLabel = view.shared ? 'Stop sharing' : 'Share with the team';

  const rename = () => {
    close();
    setEditing(true);
  };
  const toggleShare = () => {
    close();
    actions
      .changeDetails(view, { name: view.name, shared: !view.shared })
      .catch((error: unknown) => portalLogger.error('Changing who sees a view failed', error));
  };
  const remove = () => {
    close();
    actions
      .remove(view)
      .catch((error: unknown) => portalLogger.error('Deleting a view failed', error));
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label={t('Options for view {name}', { name: view.name })}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        disabled={actions.busy}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem onClick={rename}>{t('Rename')}</MenuItem>
        <MenuItem onClick={toggleShare}>{t(shareLabel)}</MenuItem>
        <MenuItem onClick={remove} sx={{ color: 'error.main' }}>
          {t('Delete')}
        </MenuItem>
      </Menu>
      {editing && (
        <SaveViewForm
          title="Edit view"
          initial={{ name: view.name, shared: view.shared }}
          onSubmit={(details) => actions.changeDetails(view, details)}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
