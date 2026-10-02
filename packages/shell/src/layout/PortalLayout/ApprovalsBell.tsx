import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Badge, IconButton } from '@/components/ui';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { useMyPendingApprovalCountQuery } from '@/graphql/generated';
import { BACKGROUND_REQUEST } from '@/config/networkActivity';

/** How often the badge re-asks the server, in ms. An approval is not real-time either. */
const POLL_INTERVAL_MS = 60_000;

/**
 * Topbar approvals badge: how many decisions are waiting, from whichever portal you are
 * standing in. Hidden entirely for somebody who approves nothing, so the chrome does not
 * offer an empty queue to every employee in the company.
 */
export function ApprovalsBell() {
  const navigate = useNavigate();
  const t = useT();
  const { data } = useMyPendingApprovalCountQuery({
    pollInterval: POLL_INTERVAL_MS,
    context: BACKGROUND_REQUEST,
  });
  const waiting = data?.myPendingApprovalCount ?? 0;
  if (waiting === 0) return null;

  return (
    <IconButton
      onClick={() => navigate('/approvals')}
      aria-label={t('{count} approvals waiting on you', { count: waiting })}
      sx={{ mr: 0.5 }}
    >
      <Badge badgeContent={waiting} color="warning" max={99}>
        <FactCheckIcon />
      </Badge>
    </IconButton>
  );
}
