import { useId, useState, type MouseEvent } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useT } from '@exyconn/i18n';
import { Button, Menu, MenuItem } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { TableFileFormat } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

interface ExportMenuButtonProps {
  /** Writes and downloads the file; resolves to the number of rows in it. */
  onExport: (format: TableFileFormat) => Promise<number>;
}

const FORMATS: readonly { format: TableFileFormat; label: string }[] = [
  { format: TableFileFormat.Csv, label: 'CSV' },
  { format: TableFileFormat.Xlsx, label: 'Excel (.xlsx)' },
];

/** "Export ▾": every row under the grid's search, sorts and filters, as CSV or Excel. */
export function ExportMenuButton({ onExport }: Readonly<ExportMenuButtonProps>) {
  const t = useT();
  const notify = useNotify();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const menuId = useId();

  const run = (format: TableFileFormat) => {
    setAnchor(null);
    setBusy(true);
    onExport(format)
      .then((count) => notify('Exported {count} rows.', 'success', { count }))
      .catch((failure: unknown) => {
        portalLogger.error('A grid export failed', failure, { format });
        notify(errorMessage(failure, t('The export failed.')), 'error');
      })
      .finally(() => setBusy(false));
  };

  return (
    <>
      <Button
        size="small"
        startIcon={<DownloadIcon />}
        endIcon={<ArrowDropDownIcon />}
        disabled={busy}
        aria-haspopup="menu"
        aria-controls={anchor ? menuId : undefined}
        aria-expanded={anchor ? 'true' : undefined}
        onClick={(event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
      >
        {busy ? t('Exporting…') : t('Export')}
      </Button>
      <Menu id={menuId} anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {FORMATS.map((entry) => (
          <MenuItem key={entry.format} onClick={() => run(entry.format)}>
            {t(entry.label)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
