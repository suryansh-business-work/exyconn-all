import { useT } from '@exyconn/i18n';
import { Box, Card, CardContent, Typography } from '@exyconn/shell/components/ui';

/** One step of "how to try it". */
export interface DemoStep {
  title: string;
  body: string;
}

/** Numbered steps in a row of cards, in order, as an ordered list for screen readers. */
export function DemoSteps({ steps }: Readonly<{ steps: readonly DemoStep[] }>) {
  const t = useT();
  return (
    <Box
      component="ol"
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: `repeat(${Math.min(steps.length, 4)}, minmax(0, 1fr))`,
        },
      }}
    >
      {steps.map((step, position) => (
        <Card key={step.title} component="li" variant="outlined">
          <CardContent>
            <Box
              aria-hidden
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                fontWeight: 'fontWeightBold',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                mb: 2,
                width: (theme) => theme.spacing(4.5),
                height: (theme) => theme.spacing(4.5),
              }}
            >
              {position + 1}
            </Box>
            <Typography
              variant="subtitle1"
              component="h3"
              sx={{ fontWeight: 'fontWeightBold', mb: 0.5 }}
            >
              {t(step.title)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(step.body)}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
