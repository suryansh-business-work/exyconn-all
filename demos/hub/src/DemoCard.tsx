import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useT } from '@exyconn/i18n';
import { DemoHighlights } from '@exyconn/demo-visitor/page';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Text,
  Typography,
} from '@exyconn/shell/components/ui';
import type { DemoEntry } from './demos';

/** One demo: a photo of it in use, what it is, what you can try, and the way in. */
export function DemoCard({ demo }: Readonly<{ demo: DemoEntry }>) {
  const t = useT();
  const Icon = demo.icon;
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        image={demo.photo.src}
        alt={t(demo.photo.alt)}
        loading="lazy"
        sx={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
      />
      <CardContent sx={{ flex: 1 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main' }}>
            <Icon aria-hidden />
            <Typography variant="h6" component="h3" sx={{ color: 'text.primary' }}>
              {t(demo.title)}
            </Typography>
          </Stack>
          <Text color="text.secondary">{t(demo.description)}</Text>
          <DemoHighlights items={demo.highlights} />
        </Stack>
      </CardContent>
      <Box sx={{ px: 2, pb: 2 }}>
        <Button variant="contained" href={demo.url} endIcon={<ArrowForwardIcon />} fullWidth>
          {t('Try the {demo}', { demo: t(demo.title) })}
        </Button>
      </Box>
    </Card>
  );
}
