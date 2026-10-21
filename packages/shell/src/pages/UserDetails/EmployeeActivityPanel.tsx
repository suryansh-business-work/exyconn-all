import { useMemo, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { useT } from '@exyconn/i18n';
import { Box, Heading, Text } from '@/components/ui';
import { densePanel } from '@/components/glass/glass';
import { AuditDetailsDrawer, type AuditLogRow } from '@/components/audit';
import { ServerDataGrid } from '@/components/data/ServerDataGrid';
import { useSettings } from '@/hooks/useSettings';
import { ACTIVITY_COLUMNS, activityFetcher, type ActivityGridContext } from './employee-activity';

/**
 * HR/ADMIN panel: everything the person did in the portal — Meeting Assistant calls, notes and
 * actions among it — newest first. Filter the Module column to one area ("Meeting Assistant").
 */
export function EmployeeActivityPanel({ employeeId }: Readonly<{ employeeId: string }>) {
  const t = useT();
  const client = useApolloClient();
  const { formatDateTime } = useSettings();
  const [selected, setSelected] = useState<AuditLogRow | null>(null);
  const fetchRows = useMemo(() => activityFetcher(client, employeeId), [client, employeeId]);
  const context = useMemo<ActivityGridContext>(() => ({ formatDateTime }), [formatDateTime]);

  return (
    <Box sx={densePanel}>
      <Heading level={6}>{t('Activity')}</Heading>
      <Text size="sm" color="text.secondary" component="p" sx={{ mt: 0 }}>
        {t(
          'What this person did across the portal, meetings included. Filter Module to narrow it.',
        )}
      </Text>
      <ServerDataGrid<AuditLogRow>
        columnDefs={ACTIVITY_COLUMNS}
        fetchRows={fetchRows}
        context={context}
        onRowClick={setSelected}
        height={420}
        searchPlaceholder="Search activity…"
      />
      <AuditDetailsDrawer
        row={selected}
        title="Activity details"
        onClose={() => setSelected(null)}
        formatDateTime={formatDateTime}
      />
    </Box>
  );
}
