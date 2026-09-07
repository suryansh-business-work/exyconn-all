import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Flex,
  Heading,
  Text,
} from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { BoolChip } from '@exyconn/shell/components/data/BoolChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useMyExitRecordQuery, type MyExitRecordQuery } from '@exyconn/shell/graphql/generated';

type ExitRecord = NonNullable<MyExitRecordQuery['myExitRecord']>;

interface ExitSummaryProps {
  exit: ExitRecord;
  formatDate: (value: string) => string;
}

/** The read-only picture of one exit: where it is, when it ends, what is settled. */
function ExitSummary({ exit, formatDate }: Readonly<ExitSummaryProps>) {
  const lastDay = exit.lastWorkingDate ? formatDate(exit.lastWorkingDate) : 'Not agreed yet';
  const daysLeft = String(exit.daysToLastWorkingDay ?? '—');
  const settlement =
    exit.finalSettlementAmount == null
      ? 'Not settled yet'
      : formatMoney(exit.finalSettlementAmount);
  return (
    <Card sx={{ maxWidth: 560 }}>
      <CardHeader
        title={<Heading level={5}>Your exit</Heading>}
        subheader={`Resigned ${formatDate(exit.resignationDate)}`}
      />
      <CardContent>
        <Flex direction="column" spacing={1.25}>
          <DetailRow label="Stage">
            <StatusChip value={exit.stage} />
          </DetailRow>
          <DetailRow label="Last working day">{lastDay}</DetailRow>
          <DetailRow label="Days left">{daysLeft}</DetailRow>
          <DetailRow label="Notice period">{exit.noticePeriodDays} days</DetailRow>
          <DetailRow label="Reason">{exit.reason || '—'}</DetailRow>
          <DetailRow label="Notes">{exit.exitInterviewNotes || '—'}</DetailRow>
          <Divider />
          <DetailRow label="Assets returned">
            <BoolChip value={exit.assetsReturned} />
          </DetailRow>
          <DetailRow label="Knowledge transfer">
            <BoolChip value={exit.knowledgeTransferDone} />
          </DetailRow>
          <DetailRow label="Documents issued">
            <BoolChip value={exit.documentsIssued} />
          </DetailRow>
          <Divider />
          <DetailRow label="Final settlement">
            <Text weight="bold">{settlement}</Text>
          </DetailRow>
        </Flex>
      </CardContent>
    </Card>
  );
}

/** Employee self-service: follow your own offboarding, if one has been opened. */
export function MyExitPage() {
  const { data, loading } = useMyExitRecordQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const exit = data?.myExitRecord;

  let content = (
    <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
      <Text color="text.secondary">No exit in progress.</Text>
    </Box>
  );
  if (exit) {
    content = <ExitSummary exit={exit} formatDate={formatDate} />;
  } else if (loading) {
    content = (
      <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
        <Text>Loading…</Text>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Exit" subtitle="Your offboarding, stage by stage" />
      {content}
    </Box>
  );
}
