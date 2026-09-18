import { Box, Card, Grid, Typography, fontWeight } from '@exyconn/shell/components/ui';

export interface AssetFact {
  label: string;
  value: string;
}

interface AssetFactsProps {
  facts: readonly AssetFact[];
}

/** The purchase and warranty facts about one asset, three to a row. */
export function AssetFacts({ facts }: Readonly<AssetFactsProps>) {
  return (
    <Grid container spacing={1.5}>
      {facts.map((fact) => (
        <Grid
          key={fact.label}
          size={{
            xs: 6,
            md: 4,
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
                variant="subtitle1"
                sx={{
                  fontWeight: fontWeight.bold,
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
