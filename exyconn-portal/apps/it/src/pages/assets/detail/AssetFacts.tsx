import { Box, Card, Grid, Typography } from '@exyconn/shell/components/ui';

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
        <Grid key={fact.label} item xs={6} md={4}>
          <Card variant="outlined" sx={{ p: 1.75, height: '100%' }}>
            <Typography variant="caption" color="text.secondary">
              {fact.label}
            </Typography>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {fact.value}
              </Typography>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
