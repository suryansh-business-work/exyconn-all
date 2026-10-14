import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { useWhatsappDemosQuery, useWhatsappWorkflowsQuery } from '@exyconn/shell/graphql/generated';
import { Button, Flex, Paper, Text } from '@exyconn/shell/components/ui';
import AddIcon from '@mui/icons-material/Add';
import { QueryErrorState } from '../../shared/QueryErrorState';
import { DEMO_PARAM } from '../model/api';
import { DemoProfileForm } from '../forms/demo-profile';
import { DemoPicker } from './DemoPicker';
import { NewWorkflowDialog } from './NewWorkflowDialog';
import { WorkflowsTable } from './WorkflowsTable';

type ProfileMode = 'closed' | 'edit' | 'new';

/** `/admin/bot-workflows`: pick a demo, edit its profile, and manage its workflows. */
export function WorkflowListPage() {
  const t = useT();
  usePageTitle(t('Bot workflows'));
  const [params, setParams] = useSearchParams();
  const [profile, setProfile] = useState<ProfileMode>('closed');
  const [creating, setCreating] = useState(false);
  const demosQuery = useWhatsappDemosQuery();
  const demos = demosQuery.data?.whatsappDemos ?? [];
  const demoId = params.get(DEMO_PARAM) ?? demos[0]?.id ?? '';
  const demo = demos.find((d) => d.id === demoId) ?? null;
  const workflowsQuery = useWhatsappWorkflowsQuery({ variables: { demoId }, skip: !demo });
  const rows = workflowsQuery.data?.whatsappWorkflows ?? [];

  const pickDemo = (id: string) => {
    setProfile('closed');
    setParams({ [DEMO_PARAM]: id });
  };

  if (demosQuery.error) {
    return (
      <QueryErrorState
        error={demosQuery.error}
        title="Could not load the demos."
        onRetry={demosQuery.refetch}
      />
    );
  }
  if (!demosQuery.data) {
    return <LoadingState />;
  }

  return (
    <Flex direction="column" spacing={2}>
      <Flex direction="row" alignItems="center" justifyContent="space-between" wrap gap={1}>
        <Text component="h1" size="lg" weight="semibold">
          {t('Bot workflows')}
        </Text>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={!demo}
          onClick={() => setCreating(true)}
        >
          {t('New workflow')}
        </Button>
      </Flex>
      <DemoPicker
        demos={demos}
        value={demo?.id ?? ''}
        onChange={pickDemo}
        onEditProfile={() => setProfile('edit')}
        onNewDemo={() => setProfile('new')}
      />
      {profile !== 'closed' && (
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <DemoProfileForm
            key={profile === 'new' ? 'new' : demoId}
            demo={profile === 'new' ? null : demo}
            onSaved={pickDemo}
            onCancel={() => setProfile('closed')}
          />
        </Paper>
      )}
      {demo && workflowsQuery.error && (
        <QueryErrorState
          error={workflowsQuery.error}
          title="Could not load the workflows."
          onRetry={workflowsQuery.refetch}
        />
      )}
      {demo && !workflowsQuery.error && (
        <WorkflowsTable
          rows={rows}
          loading={!workflowsQuery.data && workflowsQuery.loading}
          onRefresh={workflowsQuery.refetch}
        />
      )}
      {!demo && profile === 'closed' && (
        <EmptyState
          icon={<AccountTreeIcon />}
          title="No demos yet."
          description="Create a demo to start building its workflows."
          actionLabel="New demo"
          onAction={() => setProfile('new')}
        />
      )}
      {demo && (
        <NewWorkflowDialog
          open={creating}
          demoId={demo.id}
          nextOrder={rows.length}
          onClose={() => setCreating(false)}
        />
      )}
    </Flex>
  );
}
