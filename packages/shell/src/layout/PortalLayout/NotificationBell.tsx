import { useNavigate } from 'react-router-dom';
import { Badge, IconButton, roundButton } from '@/components/ui';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useMyUnreadNotificationCountQuery } from '@/graphql/generated';

/** How often the badge re-asks the server, in ms. Notifications are not real-time. */
const POLL_INTERVAL_MS = 60_000;

/** Topbar bell: unread badge, and a click opens the shared notification centre. */
export function NotificationBell() {
  const navigate = useNavigate();
  const { data } = useMyUnreadNotificationCountQuery({ pollInterval: POLL_INTERVAL_MS });
  const unread = data?.myUnreadNotificationCount ?? 0;
  const label = unread > 0 ? `${unread} unread notifications` : 'notifications';

  return (
    <IconButton
      onClick={() => navigate('/notifications')}
      aria-label={label}
      sx={(t) => ({ ...roundButton(t), mr: 1 })}
    >
      <Badge badgeContent={unread} color="error" max={99}>
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
}
