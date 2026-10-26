import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Flex } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { FormSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useLeadSourceConfigQuery,
  useStartClutchSearchMutation,
} from '@exyconn/shell/graphql/generated';
import { ApifySettingsCard } from './ApifySettingsCard';
import { ClutchRunView } from './ClutchRunView';
import { ClutchRunsList } from './ClutchRunsList';
import { CLUTCH_PATH, clutchRunPath } from './clutch.paths';
import { ClutchSearchForm, type ClutchSearchFormValues } from './forms/clutch-search';

/**
 * CRM > Lead generators > Clutch: find B2B service providers on Clutch.co — company search,
 * full details, client reviews and portfolio — on Clutch's own MCP server or Apify, keep each
 * search, and file the chosen companies (and any people with an email) into the CRM.
 */
export function ClutchPage() {
  const t = useT();
  const notify = useNotify();
  const navigate = useNavigate();
  const { runId } = useParams();
  const [searching, setSearching] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const config = useLeadSourceConfigQuery({ fetchPolicy: 'cache-and-network' });
  const [start] = useStartClutchSearchMutation();
  const settings = config.data?.leadSourceConfig;

  const search = async (values: ClutchSearchFormValues) => {
    try {
      const { data } = await start({
        variables: { input: { ...values, maxItems: Number(values.maxItems) } },
      });
      setSearching(false);
      setRefresh((count) => count + 1);
      if (data?.startClutchSearch) {
        navigate(clutchRunPath(data.startClutchSearch.id));
      }
    } catch (err) {
      notify(errorMessage(err, 'Could not start the search'), 'error');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Clutch"
        subtitle="Find B2B service providers on Clutch.co with their reviews and portfolio, and add them to the CRM"
      />
      {config.error && !settings && <Alert severity="error">{config.error.message}</Alert>}
      {!settings && !config.error && <FormSkeleton fields={2} label="Loading Clutch" />}
      {settings && <ApifySettingsCard settings={settings} />}
      <Flex direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        {runId ? (
          <Button
            startIcon={<ArrowBackIcon />}
            color="inherit"
            onClick={() => navigate(CLUTCH_PATH)}
          >
            {t('All searches')}
          </Button>
        ) : (
          <span />
        )}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={!settings}
          onClick={() => setSearching(true)}
        >
          {t('New search')}
        </Button>
      </Flex>
      {runId ? (
        <ClutchRunView key={runId} runId={runId} />
      ) : (
        <ClutchRunsList refreshSignal={refresh} />
      )}
      <CrudDialog open={searching} title={t('Search Clutch')} onClose={() => setSearching(false)}>
        {searching && settings && (
          <ClutchSearchForm
            apifyReady={settings.hasApifyToken}
            onSearch={search}
            onCancel={() => setSearching(false)}
          />
        )}
      </CrudDialog>
    </Box>
  );
}
