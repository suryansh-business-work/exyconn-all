import GroupsIcon from '@mui/icons-material/Groups';
import { useT } from '@exyconn/i18n';
import { Chip, Tooltip } from '@exyconn/shell/components/ui';

interface ViewChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  /** Set for a view the team sees: who saved it, or empty when it is the viewer's own. */
  sharedBy?: string;
}

/** One saved view in the row of views; a shared one wears the team icon and names its owner. */
export function ViewChip({ label, selected, onClick, sharedBy }: Readonly<ViewChipProps>) {
  const t = useT();
  const shared = sharedBy !== undefined;
  const chip = (
    <Chip
      label={label}
      icon={shared ? <GroupsIcon fontSize="small" /> : undefined}
      color={selected ? 'primary' : 'default'}
      variant={selected ? 'filled' : 'outlined'}
      onClick={onClick}
      aria-pressed={selected}
    />
  );
  if (!shared) {
    return chip;
  }
  const title = sharedBy ? t('Shared by {name}', { name: sharedBy }) : t('Shared with the team');
  // The title describes the chip; its name stays the view name.
  return (
    <Tooltip title={title} describeChild>
      {chip}
    </Tooltip>
  );
}
