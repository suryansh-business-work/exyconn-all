import { useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import { Button, CircularProgress, ListItemIcon, ListItemText, Menu, MenuItem } from '@exyconn/ui';
import type { ExportFormat } from './download';

export interface DownloadMenuLabels {
  button: string;
  pdf: string;
  docx: string;
}

export interface DownloadMenuProps {
  /** Every word the menu shows, already translated by the host. */
  labels: DownloadMenuLabels;
  /**
   * Writes and saves the file. Expected to report its own failures to the person; the menu
   * only shows that it is busy until this settles.
   */
  onSelect: (format: ExportFormat) => Promise<void>;
  disabled?: boolean;
}

const FORMATS: readonly { format: ExportFormat; icon: typeof DownloadIcon }[] = [
  { format: 'pdf', icon: PictureAsPdfIcon },
  { format: 'docx', icon: DescriptionIcon },
];

/** A "Download" button that offers the document as a PDF or a Word file. */
export function DownloadMenu({ labels, onSelect, disabled = false }: Readonly<DownloadMenuProps>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);

  const choose = async (format: ExportFormat) => {
    setAnchor(null);
    setBusy(true);
    try {
      await onSelect(format);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        disabled={disabled || busy}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        startIcon={busy ? <CircularProgress size={16} /> : <DownloadIcon />}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {labels.button}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {FORMATS.map(({ format, icon: Icon }) => (
          <MenuItem
            key={format}
            onClick={() => {
              choose(format).catch((error: unknown) => console.error('Download failed', error));
            }}
          >
            <ListItemIcon>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{labels[format]}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
