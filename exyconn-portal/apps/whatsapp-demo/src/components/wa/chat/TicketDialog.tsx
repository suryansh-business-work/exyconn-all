import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@exyconn/shell/components/ui';
import type { Ticket } from '@exyconn/wa-flow';
import { WA_FONT, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { QrSvg } from '../messages/QrSvg';

/** A ticket's QR code, big enough to scan at a counter. */
export function TicketDialog({
  ticket,
  onClose,
}: Readonly<{ ticket: Ticket | null; onClose: () => void }>) {
  const t = useT();
  return (
    <Dialog
      open={Boolean(ticket)}
      onClose={onClose}
      aria-labelledby="wa-ticket-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="wa-ticket-title">{ticket?.title}</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: WA_SPACE.md }}
      >
        {ticket ? (
          <>
            <QrSvg
              data={ticket.qrData}
              size={`calc(${WA_SIZE.qr} * 1.6)`}
              label={t('QR code for {id}', { id: ticket.ticketId })}
            />
            <Box sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: WA_FONT.heading }}>
              {ticket.ticketId}
            </Box>
            {ticket.subtitle ? <Box sx={{ opacity: 0.75 }}>{ticket.subtitle}</Box> : null}
          </>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
