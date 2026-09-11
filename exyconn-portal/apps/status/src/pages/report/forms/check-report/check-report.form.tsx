import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { REPORT_REFERENCE } from '@exyconn/regex';
import { Box, Flex, Typography } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { formatWith } from '@exyconn/shell/utils/date';
import { useProblemReportStatusLazyQuery } from '@exyconn/shell/graphql/generated';
import { TIME_FORMAT } from '../../../../status.constants';
import type { ReportStatus } from './check-report.types';

/** `EXY-4KQ7W2`, as printed on the receipt; case and spaces are forgiven. */
export const checkReportSchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(REPORT_REFERENCE, 'A reference looks like EXY-4KQ7W2'),
});

type Values = z.infer<typeof checkReportSchema>;

interface CheckReportFormProps {
  onCancel: () => void;
}

/** The answer, once one has come back. */
function ReportStatusLine({ status }: Readonly<{ status: ReportStatus }>) {
  return (
    <Box sx={{ mt: 1 }}>
      <Flex alignItems="center" spacing={1} flexWrap="wrap">
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
          }}
        >
          {status.reference}
        </Typography>
        <StatusChip value={status.status} />
      </Flex>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
        }}
      >
        {status.serviceName || 'Whole platform'} · last updated{' '}
        {formatWith(status.updatedAt, TIME_FORMAT)}
      </Typography>
    </Box>
  );
}

/** Looks up one report by the reference the reporter was given. */
export function CheckReportForm({ onCancel }: Readonly<CheckReportFormProps>) {
  const notify = useNotify();
  const [lookup] = useProblemReportStatusLazyQuery({ fetchPolicy: 'network-only' });
  const [status, setStatus] = useState<ReportStatus | null>(null);
  const methods = useForm<z.input<typeof checkReportSchema>, unknown, Values>({
    resolver: zodResolver(checkReportSchema),
    defaultValues: { reference: '' },
  });

  const onSubmit = async (values: Values) => {
    try {
      const { data, error } = await lookup({ variables: { reference: values.reference } });
      if (error) {
        throw error;
      }
      setStatus(data?.problemReportStatus ?? null);
    } catch (error) {
      setStatus(null);
      notify(errorMessage(error, 'Could not find that report'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Check"
    >
      <RhfTextField
        name="reference"
        label="Report reference"
        helperText="The EXY- code from your receipt"
      />
      {status && <ReportStatusLine status={status} />}
    </EntityForm>
  );
}
