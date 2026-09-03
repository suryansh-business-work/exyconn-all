import { Box, Stack, Typography } from '@exyconn/shell/components/ui';
import { formatMoney } from '@exyconn/shell/utils/money';
import type { DealRow } from './forms/deal';

interface DealCardProps {
  deal: DealRow;
  accent: string;
  onOpen: (deal: DealRow) => void;
}

/**
 * One opportunity on the board. It is a button, not a clickable div, so it is
 * reachable by keyboard and announced correctly.
 */
export function DealCard({ deal, accent, onOpen }: Readonly<DealCardProps>) {
  return (
    <Box
      component="button"
      type="button"
      onClick={() => onOpen(deal)}
      sx={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        p: 1.25,
        mb: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        font: 'inherit',
        '&:hover': { borderColor: accent },
      }}
    >
      <Typography variant="body2" fontWeight={600} noWrap>
        {deal.title}
      </Typography>
      {deal.companyName && (
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {deal.companyName}
        </Typography>
      )}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography variant="caption" fontWeight={700}>
          {formatMoney(deal.value)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {deal.probability}%
        </Typography>
      </Stack>
    </Box>
  );
}
