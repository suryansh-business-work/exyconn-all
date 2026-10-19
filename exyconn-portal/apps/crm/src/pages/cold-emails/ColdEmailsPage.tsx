import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { DraftsGrid } from './DraftsGrid';

/** CRM > Cold emails: every cold email drafted with the AI, each with all its versions. */
export function ColdEmailsPage() {
  return (
    <Box>
      <PageHeader
        title="Cold emails"
        subtitle="AI-written first emails to contacts and companies, with every version kept"
      />
      <DraftsGrid />
    </Box>
  );
}
