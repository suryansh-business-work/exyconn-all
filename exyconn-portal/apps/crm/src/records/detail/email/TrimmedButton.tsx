import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useT } from '@exyconn/i18n';
import { IconButton, Tooltip } from '@exyconn/shell/components/ui';

interface TrimmedButtonProps {
  open: boolean;
  onToggle: () => void;
}

/** Gmail's "⋯": shows or hides the earlier mail a message quotes. */
export function TrimmedButton({ open, onToggle }: Readonly<TrimmedButtonProps>) {
  const t = useT();
  const label = open ? t('Hide quoted text') : t('Show quoted text');
  return (
    <Tooltip title={label}>
      <IconButton
        size="small"
        onClick={onToggle}
        aria-label={label}
        aria-expanded={open}
        sx={{ alignSelf: 'flex-start', border: 1, borderColor: 'divider' }}
      >
        <MoreHorizIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
