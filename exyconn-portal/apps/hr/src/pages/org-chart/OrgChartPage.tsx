import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';

import { useOrgChartQuery } from '@exyconn/shell/graphql/generated';
import { buildOrgTree, type OrgTreeNode } from './org-tree';
import { OrgNodeCard } from './OrgNodeCard';
import { panel } from '@exyconn/shell/components/glass/glass';

interface OrgGroupProps {
  title: string;
  hint: string;
  nodes: OrgTreeNode[];
  emptyMessage: string;
  onOpen: (id: string) => void;
}

/** A titled group of trees — the reporting lines, or the people not yet placed. */
function OrgGroup({ title, hint, nodes, emptyMessage, onOpen }: Readonly<OrgGroupProps>) {
  return (
    <Box sx={panel}>
      <Heading level={6}>{title}</Heading>
      <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
        {hint}
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

/** HR: who reports to whom, nested from the people with nobody above them. */
export function OrgChartPage() {
  const t = useT();
  const { data, loading } = useOrgChartQuery({ fetchPolicy: 'cache-and-network' });
  const navigate = useNavigate();
  const tree = useMemo(() => buildOrgTree(data?.orgChart ?? []), [data]);
  const openEmployee = (id: string) => navigate(`/hr/employees/${id}`);
  const loadingText = loading
    ? t('Loading…')
    : t('No reporting lines yet — set “Reports to” on an employee record.');

  return (
    <Box>
      <PageHeader title="Org Chart" subtitle="Reporting lines across the company" />
      <Flex direction="column" spacing={2}>
        <OrgGroup
          title={t('Reporting lines')}
          hint={t('Click a person to open their record; expand a manager to see their team.')}
          nodes={tree.trees}
          emptyMessage={loadingText}
          onOpen={openEmployee}
        />
        <OrgGroup
          title={t('No manager set')}
          hint={t('Active people with nobody above them and nobody reporting to them.')}
          nodes={tree.unplaced}
          emptyMessage={loading ? t('Loading…') : t('Everyone is placed.')}
          onOpen={openEmployee}
        />
      </Flex>
    </Box>
  );
}
