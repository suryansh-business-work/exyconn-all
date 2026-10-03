import { useT } from '@exyconn/i18n';
import { Box, ButtonBase } from '@exyconn/shell/components/ui';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_RADIUS, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { useChatActions } from '../ChatActions';
import { Bubble } from './Bubble';
import { MessageText } from './MessageText';
import { QrSvg } from './QrSvg';
import type { ContentProps } from './types';

/** A pass: title, a real QR code (tap to enlarge), its id and details. */
export function TicketMessage({ content, frame }: ContentProps<'ticket'>) {
  const t = useT();
  const c = useWaPalette();
  const { openTicket } = useChatActions();
  const { ticket } = content;
  return (
    <Box sx={{ width: WA_SIZE.card, maxWidth: '100%' }}>
      <Bubble mine={false} tail={frame.tail} time={frame.time}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: WA_SPACE.sm, mb: WA_SPACE.sm }}>
          <ConfirmationNumberIcon sx={{ color: c.brand }} />
          <Box>
            <Box sx={{ fontWeight: 700 }}>{ticket.title}</Box>
            {ticket.subtitle ? (
              <Box sx={{ fontSize: WA_FONT.small, color: c.textMuted }}>{ticket.subtitle}</Box>
            ) : null}
          </Box>
        </Box>
        <ButtonBase
          onClick={() => openTicket(ticket)}
          aria-label={t('Enlarge QR code for {id}', { id: ticket.ticketId })}
          sx={{
            display: 'block',
            mx: 'auto',
            p: WA_SPACE.sm,
            bgcolor: c.qrPaper,
            borderRadius: WA_RADIUS.card,
          }}
        >
          <QrSvg
            data={ticket.qrData}
            size={WA_SIZE.qr}
            label={t('QR code for {id}', { id: ticket.ticketId })}
          />
        </ButtonBase>
        <Box
          sx={{
            textAlign: 'center',
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '0.08em',
            my: WA_SPACE.xs,
          }}
        >
          {ticket.ticketId}
        </Box>
        <Box
          component="dl"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            columnGap: WA_SPACE.md,
            rowGap: WA_SPACE.hair,
            m: 0,
            fontSize: WA_FONT.small,
          }}
        >
          {ticket.fields.map((f) => (
            <Box key={f.label} sx={{ display: 'contents' }}>
              <Box component="dt" sx={{ color: c.textMuted }}>
                {f.label}
              </Box>
              <Box component="dd" sx={{ m: 0, fontWeight: 500 }}>
                {f.value}
              </Box>
            </Box>
          ))}
        </Box>
        {content.caption ? (
          <Box sx={{ mt: WA_SPACE.xs }}>
            <MessageText text={content.caption} />
          </Box>
        ) : null}
      </Bubble>
    </Box>
  );
}
