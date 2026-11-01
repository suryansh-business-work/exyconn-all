import { useFormatters, useT } from '@exyconn/i18n';
import { ModuleOverview } from '@exyconn/shell/components/dashboard/ModuleOverview';
import { Alert, Button, Typography } from '@exyconn/shell/components/ui';
import { useAgentsOverviewQuery } from '@exyconn/shell/graphql/generated';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { CALLING_BOT_PATH, WEBSITE_BOT_PATH, WHATSAPP_AGENT_PATH } from '../bots';
import { CHAT_PATHS } from '../chat/chat.routes';
import { OVERVIEW_DAYS, overviewBreakdowns, overviewStats } from './agents-overview.summary';

const LINKS = [
  { label: 'WhatsApp agent', to: WHATSAPP_AGENT_PATH },
  { label: 'Calling bot', to: CALLING_BOT_PATH },
  { label: 'Website chat agent', to: WEBSITE_BOT_PATH },
  { label: 'Chat sessions', to: CHAT_PATHS.sessions },
  { label: 'WhatsApp leads', to: '/agents/whatsapp-leads' },
];

/**
 * Agents → Overview: what every AI agent did in the last 30 days — conversations across the
 * WhatsApp, website and calling agents, the leads they captured, how calls went and how many live
 * website chats the bots handled without a person.
 */
export function AgentsOverviewPage() {
  const t = useT();
  const { formatPercent } = useFormatters();
  const { formatDate } = useSettings();
  const { data, loading, error, refetch } = useAgentsOverviewQuery({
    variables: { days: OVERVIEW_DAYS },
    fetchPolicy: 'cache-and-network',
  });
  const overview = data?.agentsOverview;
  const percent = (share: number) => formatPercent(share * 100);
  const retry = () => {
    refetch().catch((retryError: unknown) =>
      portalLogger.warn('Agents overview: retry failed', retryError),
    );
  };

  return (
    <ModuleOverview
      title="Agents"
      subtitle="Every AI agent's conversations, calls and leads at a glance"
      stats={overviewStats(overview, percent)}
      statsLoading={!overview && loading}
      breakdowns={overviewBreakdowns(overview)}
      links={LINKS}
    >
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={retry}>
              {t('Retry')}
            </Button>
          }
        >
          {t('The overview could not be loaded.')}{' '}
          {errorMessage(error, t('The server did not answer.'))}
        </Alert>
      )}
      {overview && (
        <Typography variant="body2" color="text.secondary">
          {t('Counted from {from} to {to}.', {
            from: formatDate(overview.from),
            to: formatDate(overview.to),
          })}
        </Typography>
      )}
    </ModuleOverview>
  );
}
