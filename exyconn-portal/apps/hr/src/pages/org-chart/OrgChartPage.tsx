import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';

import { useOrgChartQuery } from '@exyconn/shell/graphql/generated';
import { buildOrgTree, type OrgTreeNode } from './org-tree';
import { OrgNodeCard } from './OrgNodeCard';
import { OrgFlowChart } from './OrgFlowChart';
import { panel } from '@exyconn/shell/components/glass/glass';

interface UnplacedGroupProps {
  nodes: OrgTreeNode[];
  emptyMessage: string;
  onOpen: (id: string) => void;
}

/** The people not yet on the chart: nobody above them and nobody reporting to them. */
function UnplacedGroup({ nodes, emptyMessage, onOpen }: Readonly<UnplacedGroupProps>) {
  const t = useT();
  return (
    <Box sx={panel}>
      <Heading level={6}>{t('No manager set')}</Heading>
      <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
        {t('Active people with nobody above them and nobody reporting to them.')}
      </Text>
      {nodes.length === 0 && (
        <Text size="sm" color="text.secondary">
          {emptyMessage}
        </Text>
      )}
      {nodes.map((node) => (
        <OrgNodeCard key={node.id} node={node} depth={0} onOpen={onOpen} />
      ))}
    </Box>
  );
}

/** HR: who reports to whom, drawn from each employee's "Reports to" manager. */
export function OrgChartPage() {
  const t = useT();
  const { data, loading } = useOrgChartQuery({ fetchPolicy: 'cache-and-network' });
  const navigate = useNavigate();
  const tree = useMemo(() => buildOrgTree(data?.orgChart ?? []), [data]);
  const openEmployee = useCallback((id: string) => navigate(`/hr/employees/${id}`), [navigate]);
  const emptyChart = loading
    ? t('Loading…')
    : t('No reporting lines yet — set “Reports to” on an employee record.');

  return (
    <Box>
      <PageHeader title="Org Chart" subtitle="Reporting lines across the company" />
      <Flex direction="column" spacing={2}>
        <Box sx={panel}>
          <Heading level={6}>{t('Reporting lines')}</Heading>
          <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
            {t('Drag to pan, scroll to zoom. Click a person to open their record.')}
          </Text>
          {tree.trees.length === 0 ? (
            <Text size="sm" color="text.secondary">
              {emptyChart}
            </Text>
          ) : (
            <OrgFlowChart trees={tree.trees} onOpen={openEmployee} />
          )}
        </Box>
        <UnplacedGroup
          nodes={tree.unplaced}
          emptyMessage={loading ? t('Loading…') : t('Everyone is placed.')}
          onOpen={openEmployee}
        />
      </Flex>
    </Box>
  );
}
