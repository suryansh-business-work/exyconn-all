import { Box, Card, Grid, Typography } from '@exyconn/shell/components/ui';

interface Fact {
  label: string;
  value: string;
}

interface SharedProjectFactsProps {
  facts: readonly Fact[];
}

/** The project's headline facts, four to a row — dates, status, budget against tracked. */
export function SharedProjectFacts({ facts }: Readonly<SharedProjectFactsProps>) {
  return (
    <Grid container spacing={1.5}>
      {facts.map((fact) => (
        <Grid
          key={fact.label}
          size={{
            xs: 6,
            md: 3,
          }}
        >
          <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              {fact.label}
            </Typography>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                {fact.value}
              </Typography>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
