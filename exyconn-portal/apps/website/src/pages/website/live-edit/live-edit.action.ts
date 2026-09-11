import DesignServicesIcon from '@mui/icons-material/DesignServices';
import type { RowActionSpec } from '@exyconn/crud';

/** Grid row action that opens the record's body in the live editor. */
export const LIVE_EDIT_ACTION: RowActionSpec = {
  key: 'liveEdit',
  label: 'live edit',
  icon: DesignServicesIcon,
  color: 'primary',
};
