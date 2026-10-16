import AppsIcon from '@mui/icons-material/Apps';
import { useT } from '@exyconn/i18n';
import { IconButton, Tooltip } from '@/components/ui';
import { useCrossAppNavigate } from '@/hooks/useCrossAppNavigate';

/** The nine-dot "All apps" button: back to Portal Home, where every module is opened from. */
export function AllAppsButton() {
  const t = useT();
  const navigateTo = useCrossAppNavigate();
  const label = t('All apps');
  return (
    <Tooltip title={label}>
      <IconButton onClick={() => navigateTo('hub', '/')} aria-label={label}>
        <AppsIcon />
      </IconButton>
    </Tooltip>
  );
}
