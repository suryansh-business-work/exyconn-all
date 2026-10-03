import { useId } from 'react';
import { useT } from '@exyconn/i18n';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
  borderWidth,
} from '@exyconn/shell/components/ui';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { useWhatsappDemoSessionQuery } from '@exyconn/shell/graphql/generated';
import { QueryErrorState } from '../../shared/QueryErrorState';
import { useIndustries } from '../../shared/useIndustries';
import { EventTimeline } from './EventTimeline';
import { SessionSummary } from './SessionSummary';

/** The drawer's width beside the grid; a phone gets the whole screen. */
const DRAWER_WIDTH = { xs: '100%', sm: 520 };

/** The loaded session: its summary, then the replayable timeline. */
function SessionBody({ sessionId }: Readonly<{ sessionId: string }>) {
  const t = useT();
  const { industryName } = useIndustries();
  const { data, loading, error, refetch } = useWhatsappDemoSessionQuery({
    variables: { sessionId },
  });
  const detail = data?.whatsappDemoSession;

  if (error) {
    return <QueryErrorState error={error} title="Could not load the session." onRetry={refetch} />;
  }
  if (loading && !detail) {
    return <LoadingState label="Loading the session" />;
  }
  if (!detail) {
    return <EmptyState title="This session no longer exists." />;
  }
  return (
    <Stack spacing={3}>
      <SessionSummary session={detail.session} industryName={industryName} />
      <Divider />
      <Box>
        <Typography variant="subtitle2" component="h3" sx={{ mb: 1.5 }}>
          {t('Timeline')}
        </Typography>
        <EventTimeline events={detail.events} industryName={industryName} />
      </Box>
    </Stack>
  );
}

interface SessionDrawerProps {
  /** The session to show, or null when the drawer is closed. */
  sessionId: string | null;
  onClose: () => void;
}

/**
 * One session's detail, beside the log: who, when, on what, and every event it recorded,
 * replayable. MUI's Drawer traps focus while open, closes on Escape and returns focus to the
 * row that opened it.
 */
export function SessionDrawer({ sessionId, onClose }: Readonly<SessionDrawerProps>) {
  const t = useT();
  const titleId = useId();

  return (
    <Drawer
      anchor="right"
      open={sessionId !== null}
      onClose={onClose}
      slotProps={{ paper: { 'aria-labelledby': titleId, sx: { width: DRAWER_WIDTH } } }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          px: 2,
          py: 1,
          borderBottom: `${borderWidth.hairline}px solid`,
          borderColor: 'divider',
        }}
      >
        <Typography id={titleId} variant="h6" component="h2" sx={{ flex: 1 }}>
          {t('Demo session')}
        </Typography>
        <IconButton aria-label={t('Close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
        {/* Keyed by session, so a replay never carries over to the next session opened. */}
        {sessionId && <SessionBody key={sessionId} sessionId={sessionId} />}
      </Box>
    </Drawer>
  );
}
