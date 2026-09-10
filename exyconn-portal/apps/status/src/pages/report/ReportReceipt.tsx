import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  Box,
  Button,
  Card,
  Flex,
  Typography,
  fontSize,
  iconSize,
} from '@exyconn/shell/components/ui';

interface ReportReceiptProps {
  reference: string;
  onAnother: () => void;
}

/** Confirmation after a report is filed: the reference, and what happens next. */
export function ReportReceipt({ reference, onAnother }: Readonly<ReportReceiptProps>) {
  const navigate = useNavigate();

  return (
    <Card variant="outlined" sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <CheckCircleIcon color="success" sx={{ fontSize: iconSize['5xl'] }} />
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          mt: 1
        }}>
        Thank you — your report is with our tech team
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: "text.secondary",
          mt: 1
        }}>
        Quote this reference if you need to follow it up.
      </Typography>
      <Box
        sx={{
          mt: 2,
          mb: 3,
          py: 1.5,
          borderRadius: 2,
          bgcolor: 'action.hover',
          fontFamily: 'monospace',
          fontSize: fontSize['3xl'],
          fontWeight: 700,
          letterSpacing: 2,
        }}
      >
        {reference}
      </Box>
      <Flex justifyContent="center" spacing={1.5}>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to status
        </Button>
        <Button variant="outlined" onClick={onAnother}>
          Report another problem
        </Button>
      </Flex>
    </Card>
  );
}
