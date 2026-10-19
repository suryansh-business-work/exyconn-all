import { useState, type MouseEvent } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DownloadIcon from '@mui/icons-material/Download';
import { useT } from '@exyconn/i18n';
import { Button, Menu, MenuItem } from '@exyconn/shell/components/ui';
import { CrmObject, useCanExportQuery } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { ExportQuery } from './fetchRecords';
import { useRecordsExport } from './useRecordsExport';

/** The permission module each record type is exported under. */
const PERMISSION_MODULE: Readonly<Record<CrmObject, string>> = {
  [CrmObject.Lead]: 'Lead',
  [CrmObject.Company]: 'Company',
  [CrmObject.Contact]: 'Contact',
};

const NO_COLUMNS: readonly string[] = [];

interface ExportRecordsButtonProps {
  object: CrmObject;
  /** The list's search, filters and sort; every matching record is exported. */
  query: ExportQuery;
  /** Property keys of the visible columns, in order; empty exports every property. */
  columns: readonly string[];
  /** The file's name; the date is appended and `.csv` added. */
  fileName: string;
}

/** "Export": all properties or the visible columns, for a role allowed to export. */
export function ExportRecordsButton({
  object,
  query,
  columns,
  fileName,
}: Readonly<ExportRecordsButtonProps>) {
  const t = useT();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { data } = useCanExportQuery({ variables: { module: PERMISSION_MODULE[object] } });
  const { busy, ready, run } = useRecordsExport({ object, query, fileName });

  if (!data?.canExport) {
    return null;
  }

  const choose = (keys: readonly string[]) => {
    setAnchor(null);
    run(keys).catch((error_: unknown) =>
      portalLogger.error('Starting a CRM export failed', error_),
    );
  };

  return (
    <>
      <Button
        size="small"
        startIcon={<DownloadIcon />}
        endIcon={<ArrowDropDownIcon />}
        disabled={busy || !ready}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        aria-controls={anchor ? 'crm-export-menu' : undefined}
        onClick={(event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
      >
        {busy ? t('Exporting…') : t('Export')}
      </Button>
      <Menu
        id="crm-export-menu"
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
      >
        <MenuItem onClick={() => choose(NO_COLUMNS)}>{t('Export all properties')}</MenuItem>
        <MenuItem disabled={columns.length === 0} onClick={() => choose(columns)}>
          {t('Export visible columns')}
        </MenuItem>
      </Menu>
    </>
  );
}
