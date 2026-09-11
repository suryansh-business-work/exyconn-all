import { borderWidth, Box, Stack, Typography } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';

export interface HealthFact {
  label: string;
  value: string;
}

interface HealthFactsCardProps {
  title: string;
  facts: readonly HealthFact[];
}

/** A frosted card of label/value rows — the runtime figures and the headline counts. */
export function HealthFactsCard({ title, facts }: Readonly<HealthFactsCardProps>) {
  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {facts.map((fact) => (
        <Stack
          key={fact.label}
          direction="row"
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: 'baseline',
            py: 0.75,
            borderTop: `${borderWidth.hairline}px solid`,
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            {fact.label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
            }}
          >
            {fact.value}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}
