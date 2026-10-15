import type { RenderedOption, RenderedOrder } from '@exyconn/wa-flow';
import { useT } from '@exyconn/i18n';
import { Box, Button, Chip, Divider, Paper, Typography } from '@exyconn/shell/components/ui';
import { useWaFormat } from '../../runtime/useWaFormat';
import { useWidgetActions } from '../WidgetActions';

function Line({
  label,
  amount,
  strong = false,
}: Readonly<{ label: string; amount: string; strong?: boolean }>) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 400 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 400 }}>
        {amount}
      </Typography>
    </Box>
  );
}

/** An order summary with its total, paid state and Pay button. */
export function OrderCard({
  order,
  pay,
}: Readonly<{ order: RenderedOrder; pay?: RenderedOption }>) {
  const t = useT();
  const format = useWaFormat();
  const { choose, look } = useWidgetActions();
  const paid = order.status === 'paid';
  return (
    <Paper variant="outlined" sx={{ p: 1.5, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700 }}>
          {order.title}
        </Typography>
        <Chip
          size="small"
          color={paid ? 'success' : 'warning'}
          label={paid ? t('Paid') : t('Payment due')}
        />
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {t('Order {id}', { id: order.orderId })}
      </Typography>
      <Box sx={{ display: 'grid', gap: 0.5, my: 1 }}>
        {order.items.map((item) => (
          <Line
            key={item.id}
            label={`${item.qty} × ${item.name}`}
            amount={format.money(item.qty * item.price)}
          />
        ))}
        {order.adjustments.map((adjustment) => (
          <Line
            key={adjustment.id}
            label={adjustment.label}
            amount={format.money(adjustment.amount)}
          />
        ))}
      </Box>
      <Divider />
      <Box sx={{ mt: 1 }}>
        <Line label={t('Total')} amount={format.money(order.total)} strong />
      </Box>
      {pay && !paid && (
        <Button
          fullWidth
          variant="contained"
          disableElevation
          onClick={() => choose(pay, order.title)}
          sx={{ mt: 1.5, bgcolor: look.fill, color: look.onFill, textTransform: 'none' }}
        >
          {pay.title}
        </Button>
      )}
    </Paper>
  );
}
