import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Card, CardContent, Typography, iconSize } from '@exyconn/shell/components/ui';

/** One reason to choose the product, with its icon. */
export interface DemoFeature {
  icon: ReactNode;
  title: string;
  body: string;
}

/** A grid of reasons, two columns on a tablet and four on a laptop. */
export function DemoFeatures({ items }: Readonly<{ items: readonly DemoFeature[] }>) {
  const t = useT();
  return (
    <Box
      component="ul"
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        },
      }}
    >
      {items.map((item) => (
        <Card key={item.title} component="li" variant="outlined">
          <CardContent>
            <Box
              aria-hidden
              sx={{ color: 'primary.main', mb: 1.5, '& svg': { fontSize: iconSize['2xl'] } }}
            >
              {item.icon}
            </Box>
            <Typography
              variant="subtitle1"
              component="h3"
              sx={{ fontWeight: 'fontWeightBold', mb: 0.5 }}
            >
              {t(item.title)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(item.body)}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
