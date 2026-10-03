import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { Alert, Box, Button } from '@exyconn/shell/components/ui';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { panel } from '@exyconn/shell/components/glass/glass';
import { SonarOverviewState } from '@exyconn/shell/graphql/generated';
import { SONAR_SETTINGS_PATH } from './sonar.types';

interface SonarProblemStateProps {
  state: SonarOverviewState;
  message: string;
}

/**
 * What the screen shows instead of a dashboard: an invitation to set SonarQube up, or the
 * reason the configured server could not be read with a way to fix its settings.
 */
export function SonarProblemState({ state, message }: Readonly<SonarProblemStateProps>) {
  const t = useT();
  const navigate = useNavigate();
  const openSettings = () => navigate(SONAR_SETTINGS_PATH);

  if (state === SonarOverviewState.NotConfigured) {
    return (
      <Box sx={panel}>
        <EmptyState
          icon={<FactCheckIcon />}
          title="SonarQube is not set up"
          description="Add the SonarQube server, a token and the project key under Environment Variables to see the project's quality here."
          actionLabel="Set up SonarQube"
          onAction={openSettings}
        />
      </Box>
    );
  }

  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={openSettings}>
          {t('Check settings')}
        </Button>
      }
    >
      {message}
    </Alert>
  );
}
