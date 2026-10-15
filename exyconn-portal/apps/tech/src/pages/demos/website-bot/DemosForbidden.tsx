import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';

/** What a bot studio screen shows when the server refuses the person (FORBIDDEN). */
export function DemosForbidden() {
  return (
    <EmptyState
      icon={<LockOutlinedIcon />}
      title="No access to the demo bots"
      description="Bot workflows, analytics and sessions are open to Tech staff and company administrators. Ask an administrator if you need access."
    />
  );
}
