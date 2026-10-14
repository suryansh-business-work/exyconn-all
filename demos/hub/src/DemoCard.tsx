import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useT } from '@exyconn/i18n';
import { Box, Button, Card, CardContent, Text, Typography } from '@exyconn/shell/components/ui';
import type { DemoEntry } from './demos';

/** One demo: what it is, and the way in. */
export function DemoCard({ demo }: Readonly<{ demo: DemoEntry }>) {
  const t = useT();
  const Icon = demo.icon;
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ color: 'primary.main', mb: 2 }}>
          <Icon fontSize="large" aria-hidden />
        </Box>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          {t(demo.title)}
        </Typography>
        <Text color="text.secondary">{t(demo.description)}</Text>
      </CardContent>
      <Box sx={{ px: 2, pb: 2 }}>
        <Button variant="contained" href={demo.url} endIcon={<ArrowForwardIcon />}>
          {t('Try the demo')}
        </Button>
      </Box>
    </Card>
  );
}
