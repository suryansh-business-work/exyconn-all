import { useEffect, useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { Alert, Box, Button, Flex, LinearProgress, Text } from '@exyconn/shell/components/ui';
import { ClutchRunStatus, useClutchRunQuery } from '@exyconn/shell/graphql/generated';
import { ClutchCompanyCard } from './ClutchCompanyCard';
import { useClutchImport } from './useClutchImport';

/** How often a running search is asked about, in milliseconds. */
const POLL_MS = 4000;

/** One search's results: progress while it runs, then the companies to choose and file. */
export function ClutchRunView({ runId }: Readonly<{ runId: string }>) {
  const t = useT();
  const { data, error, startPolling, stopPolling } = useClutchRunQuery({
    variables: { id: runId },
    fetchPolicy: 'cache-and-network',
    pollInterval: POLL_MS,
  });
  const run = data?.clutchRun;
  const running = !run || run.status === ClutchRunStatus.Running;
  // Asks again only while the search is still going; a finished run never changes.
  useEffect(() => {
    if (running) {
      startPolling(POLL_MS);
    } else {
      stopPolling();
    }
  }, [running, startPolling, stopPolling]);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const filed = useMemo(() => new Set(run?.filedKeys ?? []), [run?.filedKeys]);
  const importer = useClutchImport(runId);

  if (error && !run) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  if (!run || running) {
    return (
      <Box role="status">
        <Text size="sm">
          {t('Searching Clutch… Apify can take a few minutes; this page updates itself.')}
        </Text>
        <LinearProgress sx={{ mt: 1 }} />
      </Box>
    );
  }
  if (run.status === ClutchRunStatus.Failed) {
    return <Alert severity="error">{run.error || t('The search failed.')}</Alert>;
  }

  const open = run.companies.filter((company) => !filed.has(company.key));
  const toggle = (key: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  const all = open.length > 0 && open.every((company) => chosen.has(company.key));

  return (
    <Flex direction="column" spacing={2}>
      {run.notes.map((note) => (
        <Alert key={note} severity="info">
          {t(note)}
        </Alert>
      ))}
      <Flex direction="row" justifyContent="space-between" alignItems="center" wrap spacing={1}>
        <Text weight="medium">{t('{count} companies found', { count: run.companyCount })}</Text>
        <Flex direction="row" spacing={1}>
          <Button
            size="small"
            disabled={open.length === 0}
            onClick={() => setChosen(all ? new Set() : new Set(open.map((c) => c.key)))}
          >
            {all ? t('Clear') : t('Choose all')}
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={chosen.size === 0 || importer.loading}
            onClick={() => {
              importer
                .run([...chosen])
                .then(() => setChosen(new Set()))
                .catch((err: unknown) => portalLogger.warn('crm: filing Clutch companies', err));
            }}
          >
            {t('Add {count} to the CRM', { count: chosen.size })}
          </Button>
        </Flex>
      </Flex>
      {importer.result && (
        <Alert severity={importer.result.skipped ? 'warning' : 'success'} onClose={importer.clear}>
          {t('{created} companies and {contacts} contacts added; {skipped} already in the CRM.', {
            created: importer.result.created,
            contacts: importer.result.contactsCreated,
            skipped: importer.result.skipped,
          })}
          {importer.result.skips.map((skip) => (
            <Text key={skip.key} size="sm">{`${skip.name}: ${skip.reason}`}</Text>
          ))}
        </Alert>
      )}
      {run.companies.length === 0 && (
        <Text color="text.secondary">{t('Clutch found nothing for that search.')}</Text>
      )}
      {run.companies.map((company) => (
        <ClutchCompanyCard
          key={company.key}
          company={company}
          selected={chosen.has(company.key)}
          filed={filed.has(company.key)}
          onToggle={toggle}
        />
      ))}
    </Flex>
  );
}
