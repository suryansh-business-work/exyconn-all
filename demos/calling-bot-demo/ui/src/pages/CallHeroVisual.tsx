import PhoneDisabledIcon from '@mui/icons-material/PhoneDisabled';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { BrowserCallPanel } from '../components/BrowserCallPanel';

interface CallHeroVisualProps {
  loading: boolean;
  available: boolean;
}

/** The hero's right side: the phone to call from, once the bot is known to be set up. */
export function CallHeroVisual({ loading, available }: Readonly<CallHeroVisualProps>) {
  if (loading) {
    return <LoadingState />;
  }
  if (available) {
    return <BrowserCallPanel />;
  }
  return (
    <EmptyState
      icon={<PhoneDisabledIcon />}
      title="The calling bot is not set up yet"
      description="Please check back soon."
    />
  );
}
