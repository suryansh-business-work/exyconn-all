import type { ReactNode } from 'react';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Box } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { SingleCheckPanel } from './SingleCheckPanel';
import { BulkCheckPanel } from './BulkCheckPanel';
import { RecordsPanel } from './RecordsPanel';

/** Route the tabs live under; each tab is a slug beneath it. */
export const EMAIL_VERIFIER_PATH = '/tools/email-verifier';

function Panel({ children }: Readonly<{ children: ReactNode }>) {
  return <Box sx={readingPanel}>{children}</Box>;
}

const TABS: TabberItem[] = [
  {
    slug: 'check',
    label: 'Check an email',
    icon: <FactCheckIcon />,
    content: (
      <Panel>
        <SingleCheckPanel />
      </Panel>
    ),
  },
  {
    slug: 'bulk',
    label: 'Bulk CSV',
    icon: <UploadFileIcon />,
    content: (
      <Panel>
        <BulkCheckPanel />
      </Panel>
    ),
  },
  {
    slug: 'records',
    label: 'Records',
    icon: <ListAltIcon />,
    content: (
      <Panel>
        <RecordsPanel />
      </Panel>
    ),
  },
];

/**
 * CRM > Tools > Email verifier: whether an address really exists, one at a time or a CSV at
 * once. Every result is kept, and every email across the CRM shows its latest one.
 */
export function EmailVerifierPage() {
  return (
    <Box>
      <PageHeader
        title="Email verifier"
        subtitle="Check that an address exists before you write to it — nothing is sent"
      />
      <Tabber basePath={EMAIL_VERIFIER_PATH} items={TABS} ariaLabel="Email verifier" />
    </Box>
  );
}
