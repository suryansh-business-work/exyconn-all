import { useState } from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
import GavelIcon from '@mui/icons-material/Gavel';
import PolicyIcon from '@mui/icons-material/Policy';
import { useT } from '@exyconn/i18n';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { LegalItemKind } from '@exyconn/shell/graphql/generated';
import { GroupsPanel } from './GroupsPanel';

/** The page's own path; the tab is the segment after it. */
export const LEGAL_GROUPS_PATH = '/legal/groups';

/**
 * Legal › Groups: sets of contracts, policies or documents — "Part Time Employee Contracts" —
 * that HR can hand to an employee together from the employee's details.
 */
export function LegalGroupsPage() {
  const t = useT();
  const [creating, setCreating] = useState(false);
  const panel = (kind: LegalItemKind) => (
    <GroupsPanel kind={kind} creating={creating} onCreated={() => setCreating(false)} />
  );
  const tabs: TabberItem[] = [
    {
      slug: 'contracts',
      label: 'Contracts',
      icon: <GavelIcon />,
      content: panel(LegalItemKind.Contract),
    },
    {
      slug: 'policies',
      label: 'Policies',
      icon: <PolicyIcon />,
      content: panel(LegalItemKind.Policy),
    },
    {
      slug: 'documents',
      label: 'Documents',
      icon: <DescriptionIcon />,
      content: panel(LegalItemKind.Document),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Groups"
        subtitle="Sets of contracts, policies and documents that are handed to employees together"
        actionLabel="Add group"
        onAction={() => setCreating(true)}
      />
      <Tabber basePath={LEGAL_GROUPS_PATH} items={tabs} ariaLabel={t('Group registers')} />
    </Box>
  );
}
