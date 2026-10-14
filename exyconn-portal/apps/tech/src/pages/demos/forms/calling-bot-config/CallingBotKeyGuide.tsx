import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyIcon from '@mui/icons-material/Key';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useT } from '@exyconn/i18n';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  Typography,
} from '@exyconn/shell/components/ui';
import { KEY_SOURCES, type KeySource } from './calling-bot-key-guide';

const EXTERNAL = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** One provider: what it does for the bot, the steps to get its keys, and its console. */
function KeySourceCard({ source }: Readonly<{ source: KeySource }>) {
  const t = useT();
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1.5} sx={{ height: '100%' }}>
          <Typography variant="subtitle2" component="h4">
            {t(source.provider)}
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 3 }}>
            {source.steps.map((step) => (
              <Typography key={step} component="li" variant="body2" sx={{ mb: 0.5 }}>
                {t(step)}
              </Typography>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {t('Fills in: {fields}', { fields: source.fields.map((field) => t(field)).join(', ') })}
          </Typography>
          <Box sx={{ mt: 'auto' }}>
            <Button size="small" href={source.url} endIcon={<OpenInNewIcon />} {...EXTERNAL}>
              {t('Open {site}', { site: source.urlLabel })}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/** "Where to get these keys": every console the bot needs, open on a new config. */
export function CallingBotKeyGuide({ isEdit }: Readonly<{ isEdit: boolean }>) {
  const t = useT();
  return (
    <Accordion defaultExpanded={!isEdit} disableGutters variant="outlined">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <KeyIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" component="h3">
            {t('Where to get these keys')}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          {KEY_SOURCES.map((source) => (
            <KeySourceCard key={source.provider} source={source} />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

/** A key field's hint: the console it comes from, as a link. */
export function KeySourceHint({ source }: Readonly<{ source: KeySource }>) {
  const t = useT();
  return (
    <>
      {t('Get it at')}{' '}
      <Link href={source.url} {...EXTERNAL}>
        {source.urlLabel}
      </Link>
    </>
  );
}
