import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useT } from '@exyconn/i18n';
import { Box, Typography } from '@exyconn/shell/components/ui';

/** A short list of what a demo proves, each line with a tick. */
export function DemoHighlights({ items }: Readonly<{ items: readonly string[] }>) {
  const t = useT();
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
      {items.map((item) => (
        <Box key={item} component="li" sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <CheckCircleIcon fontSize="small" color="success" aria-hidden sx={{ mt: 0.25 }} />
          <Typography variant="body2">{t(item)}</Typography>
        </Box>
      ))}
    </Box>
  );
}
