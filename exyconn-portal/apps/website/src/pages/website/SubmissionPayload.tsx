import { Box, Typography } from '@exyconn/shell/components/ui';

const PRE_SX = {
  whiteSpace: 'pre-wrap',
  overflowX: 'auto',
  fontSize: 12,
  m: 0,
  p: 1.5,
  borderRadius: 1,
  border: 1,
  borderColor: 'divider',
  bgcolor: 'action.hover',
} as const;

interface SubmissionPayloadProps {
  /** Raw `JSON` scalar captured by the public website form — shape varies per form type. */
  data: unknown;
}

/** Read-only, pretty-printed view of a submission's payload. */
export function SubmissionPayload({ data }: Readonly<SubmissionPayloadProps>) {
  const isObject = typeof data === 'object' && data !== null;
  const body = isObject
    ? JSON.stringify(data, null, 2)
    : 'No payload captured for this submission.';

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Submitted payload
      </Typography>
      <Box component="pre" sx={PRE_SX}>
        {body}
      </Box>
    </Box>
  );
}
