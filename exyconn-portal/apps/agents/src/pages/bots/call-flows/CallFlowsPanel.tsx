import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { StudioProvider, type StudioConfig } from '@exyconn/bot-studio/studio';
import { WidgetPreview } from '@exyconn/bot-studio/widget';
import {
  useCallingBotAvailabilityQuery,
  useCallingBotScenarioFlowsQuery,
} from '@exyconn/shell/graphql/generated';
import {
  Alert,
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Paper,
} from '@exyconn/shell/components/ui';
import {
  ChartSkeleton,
  PageHeaderSkeleton,
  SkeletonStatus,
} from '@exyconn/shell/components/feedback/skeletons';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { DemosForbidden } from '../website-bot/DemosForbidden';
import { CallFlowEditor } from './CallFlowEditor';
import { CALLING_BOT_PATH } from '../callingBot.paths';

/** The example being edited is kept in the URL. */
const EXAMPLE_PARAM = 'example';

/** The studio's preview, for rehearsing a call flow as text in the website widget. */
const STUDIO: StudioConfig = {
  channel: 'website',
  name: 'Calling bot',
  workflowsPath: `${CALLING_BOT_PATH}/call-flows`,
  renderPreview: (bundle, startWorkflow) => (
    <WidgetPreview bundle={bundle} startWorkflow={startWorkflow} />
  ),
  forbidden: <DemosForbidden />,
};

/**
 * Agents > Calling bot > Call flows: each example's conversation drawn in React Flow —
 * what the bot says, the choices it offers aloud, the details it collects and where each
 * answer leads. Saved flows become the call script the voice agent follows.
 */
export function CallFlowsPanel() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const { data, loading, error } = useCallingBotScenarioFlowsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const availability = useCallingBotAvailabilityQuery({ fetchPolicy: 'cache-and-network' });
  const rows = useMemo(() => data?.callingBotScenarios ?? [], [data]);
  const selected = rows.find((row) => row.id === params.get(EXAMPLE_PARAM)) ?? rows[0];
  const live = availability.data?.callingBotAvailability.available ?? false;

  if (error && !data) {
    return <Alert severity="error">{errorMessage(error, t('Could not load the examples.'))}</Alert>;
  }
  if (loading && !data) {
    return (
      <SkeletonStatus>
        <PageHeaderSkeleton action={false} />
        <ChartSkeleton height={480} />
      </SkeletonStatus>
    );
  }
  if (!selected) {
    return (
      <EmptyState
        title="No examples yet"
        description="Add one under Examples, then draw its call flow here."
      />
    );
  }

  return (
    <StudioProvider config={STUDIO}>
      <PageHeader
        title="Call flows"
        subtitle="Draw how each example call goes. Saved flows become the script the voice agent follows."
      />
      {!live && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t(
            'Showcase mode: design flows and rehearse them as text here. Live calls start once the Sarvam and OpenAI keys are saved under Settings.',
          )}
        </Alert>
      )}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' },
        }}
      >
        <Paper variant="outlined" sx={{ maxHeight: { lg: '80dvh' }, overflowY: 'auto' }}>
          <List dense disablePadding aria-label={t('Examples')}>
            {rows.map((row) => (
              <ListItemButton
                key={row.id}
                selected={row.id === selected.id}
                onClick={() => setParams({ [EXAMPLE_PARAM]: row.id })}
                divider
              >
                <ListItemText primary={row.title} secondary={row.description} />
                <Chip
                  size="small"
                  variant={row.flow ? 'filled' : 'outlined'}
                  label={row.flow ? t('Flow') : t('Prompt only')}
                  sx={{ ml: 1 }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
        <CallFlowEditor key={selected.id} row={selected} aiConfigured={live} />
      </Box>
    </StudioProvider>
  );
}
