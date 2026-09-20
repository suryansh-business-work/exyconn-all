import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Card,
  Flex,
  Typography,
  fontSize,
  fontWeight,
  iconSize,
} from '@exyconn/shell/components/ui';

interface TicketReceiptProps {
  reference: string;
  onAnother: () => void;
}

/** Confirmation after a ticket is raised: the reference, and what happens next. */
export function TicketReceipt({ reference, onAnother }: Readonly<TicketReceiptProps>) {
  const t = useT();
  const navigate = useNavigate();

  return (
    <Card variant="outlined" sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <CheckCircleIcon color="success" sx={{ fontSize: iconSize['5xl'] }} />
      <Typography variant="h5" sx={{ fontWeight: fontWeight.bold, mt: 1 }}>
        {t('We have it')}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
        {t('Keep this reference. It is how you follow the ticket, and how we find it fast.')}
      </Typography>
      <Box
        sx={{
          my: 2,
          fontFamily: 'monospace',
          fontSize: fontSize.xl,
          fontWeight: fontWeight.bold,
        }}
      >
        {reference}
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {t('A confirmation is on its way to the address you gave us.')}
      </Typography>
      <Flex direction="row" spacing={1} sx={{ justifyContent: 'center', mt: 2 }}>
        <Button variant="outlined" onClick={onAnother}>
          {t('Ask about something else')}
        </Button>
        <Button variant="text" onClick={() => navigate('/')}>
          {t('Back to status')}
        </Button>
      </Flex>
    </Card>
  );
}
