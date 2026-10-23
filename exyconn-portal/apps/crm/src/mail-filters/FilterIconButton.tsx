import FilterListIcon from '@mui/icons-material/FilterList';
import { useT } from '@exyconn/i18n';
import { Badge, IconButton, Tooltip } from '@exyconn/shell/components/ui';

interface FilterIconButtonProps {
  /** How many filters are set, shown on the icon. */
  count: number;
  onClick: () => void;
}

/** The filter icon of an email list, with how many filters are on. */
export function FilterIconButton({ count, onClick }: Readonly<FilterIconButtonProps>) {
  const t = useT();
  const label = t('Filters ({count} active)', { count });
  return (
    <Tooltip title={label}>
      <IconButton onClick={onClick} aria-label={label} aria-haspopup="dialog">
        <Badge badgeContent={count} color="primary">
          <FilterListIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
