import { useT } from '@exyconn/i18n';
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

import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useMyExitRecordQuery, type MyExitRecordQuery } from '@exyconn/shell/graphql/generated';
import { readingPanel } from '@exyconn/shell/components/glass/glass';

type ExitRecord = NonNullable<MyExitRecordQuery['myExitRecord']>;

interface ExitSummaryProps {
  exit: ExitRecord;
  formatDate: (value: string) => string;
}

/** The read-only picture of one exit: where it is, when it ends, what is settled. */
function ExitSummary({ exit, formatDate }: Readonly<ExitSummaryProps>) {
  const t = useT();
  const lastDay = exit.lastWorkingDate ? formatDate(exit.lastWorkingDate) : t('Not agreed yet');
  const daysLeft = String(exit.daysToLastWorkingDay ?? '—');
  const settlement =
    exit.finalSettlementAmount == null
      ? t('Not settled yet')
      : formatMoney(exit.finalSettlementAmount);
  return (
    <Card sx={{ maxWidth: 560 }}>
      <CardHeader
        title={<Heading level={5}>{t('Your exit')}</Heading>}
        subheader={t('Resigned {date}', { date: formatDate(exit.resignationDate) })}
      />
      <CardContent>
        <Flex direction="column" spacing={1.5}>
          <DetailRow label={t('Stage')}>
            <StatusChip value={exit.stage} />
          </DetailRow>
          <DetailRow label={t('Last working day')}>{lastDay}</DetailRow>
          <DetailRow label={t('Days left')}>{daysLeft}</DetailRow>
          <DetailRow label={t('Notice period')}>
            {t('{days} days', { days: exit.noticePeriodDays })}
          </DetailRow>
          <DetailRow label={t('Reason')}>{exit.reason || '—'}</DetailRow>
          <DetailRow label={t('Notes')}>{exit.exitInterviewNotes || '—'}</DetailRow>
          <Divider />
          <DetailRow label={t('Assets returned')}>
            <BoolChip value={exit.assetsReturned} />
          </DetailRow>
          <DetailRow label={t('Knowledge transfer')}>
            <BoolChip value={exit.knowledgeTransferDone} />
          </DetailRow>
          <DetailRow label={t('Documents issued')}>
            <BoolChip value={exit.documentsIssued} />
          </DetailRow>
          <Divider />
          <DetailRow label={t('Final settlement')}>
            <Text weight="bold">{settlement}</Text>
          </DetailRow>
        </Flex>
      </CardContent>
    </Card>
  );
}

/** Employee self-service: follow your own offboarding, if one has been opened. */
export function MyExitPage() {
  const t = useT();
  const { data, loading } = useMyExitRecordQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const exit = data?.myExitRecord;

  let content = (
    <Box sx={readingPanel}>
      <Text color="text.secondary">{t('No exit in progress.')}</Text>
    </Box>
  );
  if (exit) {
    content = <ExitSummary exit={exit} formatDate={formatDate} />;
  } else if (loading) {
    content = (
      <Box sx={readingPanel}>
        <Text>{t('Loading…')}</Text>
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
