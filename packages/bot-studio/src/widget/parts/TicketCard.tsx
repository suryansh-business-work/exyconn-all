import type { Ticket } from '@exyconn/wa-flow';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { Box, Paper, Typography } from '@exyconn/shell/components/ui';
import { useWidgetActions } from '../WidgetActions';

/** A booking, pass or support ticket: its number up top, then its details in two columns. */
export function TicketCard({ ticket, caption }: Readonly<{ ticket: Ticket; caption?: string }>) {
  const { look } = useWidgetActions();
  return (
    <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          bgcolor: look.fill,
          color: look.onFill,
        }}
      >
        <ConfirmationNumberIcon aria-hidden />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700 }}>
            {ticket.title}
          </Typography>
          <Typography variant="caption" component="p">
            {ticket.ticketId}
          </Typography>
        </Box>
      </Box>
      {ticket.subtitle && (
        <Typography variant="body2" sx={{ px: 1.5, pt: 1 }}>
          {ticket.subtitle}
        </Typography>
      )}
      <Box
        component="dl"
        sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, m: 0, p: 1.5 }}
      >
        {ticket.fields.map((field) => (
          <Box key={field.label}>
            <Typography component="dt" variant="caption" sx={{ color: 'text.secondary' }}>
              {field.label}
            </Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 600 }}>
              {field.value}
            </Typography>
          </Box>
        ))}
      </Box>
      {caption && (
        <Typography variant="body2" sx={{ px: 1.5, pb: 1.5, whiteSpace: 'pre-wrap' }}>
          {caption}
        </Typography>
      )}
    </Paper>
  );
}
