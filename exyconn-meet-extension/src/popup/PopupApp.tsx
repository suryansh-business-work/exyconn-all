import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Link,
  Stack,
  Typography,
} from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { Logger } from '@exyconn/logger';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from '@mui/icons-material/Settings';
import { PORTAL_MEETINGS_PATH, PORTAL_URL } from '../config';
import { AccountCard } from '../components/AccountCard';
import { CaptureControls } from '../components/CaptureControls';
import { MeetingStatus } from '../components/MeetingStatus';
import { useWorkerState } from '../hooks/useWorkerState';
import type { WorkerState } from '../types/messages';
import { logTo } from '../services/logger';

/** The popup is a fixed-width surface; Chrome sizes it to the content. */
const POPUP_WIDTH = 360;

interface Props {
  tabId: number | null;
  logger: Logger;
}

interface BodyProps {
  state: WorkerState;
  logger: Logger;
  onChanged: () => void;
}

/** The account, then this tab's call — or a hint to open one. */
function PopupBody({ state, logger, onChanged }: Readonly<BodyProps>) {
  const t = useT();
  const account = <AccountCard auth={state.auth} logger={logger} onChanged={onChanged} />;
  if (!state.auth.signedIn) {
    return account;
  }
  return (
    <>
      {account}
      <Divider />
      {state.tab === null ? (
        <Alert severity="info">{t('Open a Google Meet call to use the assistant')}</Alert>
      ) : (
        <Stack spacing={1.5}>
          <MeetingStatus tab={state.tab} />
          <CaptureControls tab={state.tab} tabId={state.tab.tabId} logger={logger} />
        </Stack>
      )}
    </>
  );
}

export function PopupApp({ tabId, logger }: Readonly<Props>) {
  const t = useT();
  const { state, refresh } = useWorkerState(tabId, logger);
  const portalUrl = `${state?.auth.org?.portalUrl ?? PORTAL_URL}${PORTAL_MEETINGS_PATH}`;
  const openSettings = (): void => {
    chrome.runtime.openOptionsPage().catch(logTo(logger, 'Could not open settings'));
  };

  return (
    <Box component="main" sx={{ width: POPUP_WIDTH, p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6" component="h1">
          {t('Exyconn Meeting Assistant')}
        </Typography>
        {state === null ? (
          <CircularProgress aria-label={t('Loading')} size={24} />
        ) : (
          <PopupBody state={state} logger={logger} onChanged={refresh} />
        )}
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
          <Link
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}
          >
            {t('Open portal')}
            <OpenInNewIcon fontSize="inherit" aria-hidden />
          </Link>
          <Button size="small" startIcon={<SettingsIcon />} onClick={openSettings}>
            {t('Settings')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
