import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, Button, Stack, Text } from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { FormSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { formatMoney } from '@exyconn/shell/utils/money';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmTimelineFieldType,
  useCrmTimelineDetailQuery,
  type CrmTimelineObject,
  type CrmTimelineDetailQuery,
} from '@exyconn/shell/graphql/generated';
import type { TimelineRow } from './TimelineEntry';

type DetailField = CrmTimelineDetailQuery['crmTimelineDetail']['fields'][number];

interface TimelineDetailFieldsProps {
  object: CrmTimelineObject;
  /** The contact or company whose timeline the entry is on. */
  recordId: string;
  row: TimelineRow;
}

/** A field's value as the viewer reads it: dates and money in their settings. */
function FieldValue({ field }: Readonly<{ field: DetailField }>) {
  const { formatDateTime } = useFormatters();
  if (field.type === CrmTimelineFieldType.Date) {
    return <time dateTime={field.value}>{formatDateTime(field.value)}</time>;
  }
  if (field.type === CrmTimelineFieldType.Money) {
    return formatMoney(Number(field.value));
  }
  return field.value;
}

/** Everything the entry's record holds — read when the dialog opens — and its full text. */
export function TimelineDetailFields({
  object,
  recordId,
  row,
}: Readonly<TimelineDetailFieldsProps>) {
  const t = useT();
  const { data, error, refetch } = useCrmTimelineDetailQuery({
    variables: { object, id: recordId, itemId: row.id },
  });
  const detail = data?.crmTimelineDetail;
  if (detail) {
    return (
      <Stack spacing={2}>
        {detail.fields.length > 0 && (
          <DetailFactGrid>
            {detail.fields.map((field) => (
              <DetailFact key={field.label} label={field.label}>
                <FieldValue field={field} />
              </DetailFact>
            ))}
          </DetailFactGrid>
        )}
        {detail.body && (
          <Text size="sm" sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
            {detail.body}
          </Text>
        )}
      </Stack>
    );
  }
  if (error) {
    const retry = () => {
      refetch().catch((error_: unknown) =>
        portalLogger.warn('crm: reloading a timeline entry failed', error_),
      );
    };
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retry}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the details.'))}
      </Alert>
    );
  }
  return <FormSkeleton fields={4} surface={false} label="Loading the details" />;
}
