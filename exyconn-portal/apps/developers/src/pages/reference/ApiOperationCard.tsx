import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useT } from '@exyconn/i18n';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import type { ApiReferenceQuery } from '@exyconn/shell/graphql/generated';

export type ApiOperationRow = ApiReferenceQuery['apiReference'][number];

const codeBlock = {
  m: 0,
  p: 1.5,
  borderRadius: 1,
  bgcolor: 'action.hover',
  fontFamily: 'monospace',
  fontSize: 12,
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
} as const;

/** The arguments of one operation, each with its type and what it is for. */
function ArgumentList({ args }: Readonly<{ args: ApiOperationRow['arguments'] }>) {
  const t = useT();
  if (args.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        {t('No arguments.')}
      </Text>
    );
  }
  return (
    <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
      {args.map((arg) => (
        <Text component="li" size="sm" key={arg.name}>
          <Box component="span" sx={{ fontFamily: 'monospace' }}>
            {arg.name}: {arg.type}
          </Box>
          {arg.description ? ` — ${arg.description}` : ''}
        </Text>
      ))}
    </Stack>
  );
}

/** One operation of the API: what it does, what it takes, what it answers, and an example. */
export function ApiOperationCard({ operation }: Readonly<{ operation: ApiOperationRow }>) {
  const t = useT();
  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Chip
            size="small"
            label={operation.kind === 'QUERY' ? t('Query') : t('Mutation')}
            color={operation.kind === 'QUERY' ? 'info' : 'warning'}
          />
          <Box component="span" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
            {operation.name}
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <Text size="sm">{operation.description}</Text>
          <Text size="sm" weight="bold">
            {t('Arguments')}
          </Text>
          <ArgumentList args={operation.arguments} />
          <Text size="sm">
            {t('Returns')}{' '}
            <Box component="span" sx={{ fontFamily: 'monospace' }}>
              {operation.returnType}
            </Box>
          </Text>
          <Text size="sm" weight="bold">
            {t('Example')}
          </Text>
          <Box component="pre" role="region" tabIndex={0} aria-label={t('Example')} sx={codeBlock}>
            {operation.example}
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
