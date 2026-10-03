import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useWaFormat } from '../../../hooks/useWaFormat';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_LINE, WA_RADIUS, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { useChatActions } from '../ChatActions';
import { ActionRows } from './ActionRows';
import { Bubble } from './Bubble';
import type { ContentProps } from './types';

const PAY_ICON = <PaymentsIcon fontSize="small" />;

/** An order / payment summary: lines, adjustments, total, status and a pay button. */
export function OrderMessage({ content, frame }: ContentProps<'order'>) {
  const t = useT();
  const c = useWaPalette();
  const { money } = useWaFormat();
  const { choose } = useChatActions();
  const { order, pay } = content;
  const paid = order.status === 'paid';
  const lines = [
    ...order.items.map((i) => ({
      id: i.id,
      label: i.qty > 1 ? `${i.name} × ${i.qty}` : i.name,
      amount: i.qty * i.price,
    })),
    ...order.adjustments.map((a) => ({ id: a.id, label: a.label, amount: a.amount })),
  ];
  return (
    <Box sx={{ width: WA_SIZE.card, maxWidth: '100%' }}>
      <Bubble mine={false} tail={frame.tail} time={frame.time}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: WA_SPACE.sm }}>
          <ReceiptLongIcon sx={{ color: c.brand }} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ fontWeight: 700 }}>{order.title}</Box>
            <Box sx={{ fontSize: WA_FONT.small, color: c.textMuted }}>
              {t('Order {id}', { id: order.orderId })}
            </Box>
          </Box>
          <Box
            sx={{
              px: WA_SPACE.xs,
              borderRadius: WA_RADIUS.chip,
              fontSize: WA_FONT.meta,
              fontWeight: 700,
              bgcolor: paid ? c.brand : c.notice,
              color: paid ? c.onBrandBar : c.noticeText,
            }}
          >
            {paid ? t('Paid') : t('Payment pending')}
          </Box>
        </Box>
        <Box
          component="ul"
          sx={{ listStyle: 'none', p: 0, m: `${WA_SPACE.sm} 0 0`, fontSize: WA_FONT.small }}
        >
          {lines.map((line) => (
            <Box
              component="li"
              key={line.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: WA_SPACE.md,
                py: WA_SPACE.hair,
              }}
            >
              <span>{line.label}</span>
              <span>{money(line.amount)}</span>
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: `${WA_LINE.hair} solid ${c.divider}`,
            mt: WA_SPACE.xs,
            pt: WA_SPACE.xs,
            fontWeight: 700,
          }}
        >
          <span>{t('Total')}</span>
          <span>{money(order.total)}</span>
        </Box>
      </Bubble>
      {pay ? (
        <ActionRows
          mine={false}
          items={[
            {
              id: pay.id,
              label: pay.title,
              icon: PAY_ICON,
              onClick: () => choose(pay, order.title),
            },
          ]}
        />
      ) : null}
    </Box>
  );
}
