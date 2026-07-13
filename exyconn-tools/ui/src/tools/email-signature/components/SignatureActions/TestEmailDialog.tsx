import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Email, Send, Close, OpenInNew } from '@mui/icons-material';

interface TestEmailDialogProps {
  open: boolean;
  testEmail: string;
  emailMethod: 'server' | 'client';
  isSending: boolean;
  onClose: () => void;
  onEmailChange: (email: string) => void;
  onMethodChange: (method: 'server' | 'client') => void;
  onSend: () => void;
}

const TestEmailDialog: React.FC<TestEmailDialogProps> = ({
  open,
  testEmail,
  emailMethod,
  isSending,
  onClose,
  onEmailChange,
  onMethodChange,
  onSend,
}) => {
  return (
    <Dialog open={open} onClose={() => !isSending && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Email color="primary" />
        Send Test Email
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Send a test email to preview how your signature looks in an actual email.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Send Method
          </Typography>
          <ToggleButtonGroup
            value={emailMethod}
            exclusive
            onChange={(_, value) => value && onMethodChange(value)}
            size="small"
            fullWidth
          >
            <ToggleButton value="server">
              <Send sx={{ mr: 1 }} fontSize="small" /> Send via Server
            </ToggleButton>
            <ToggleButton value="client">
              <OpenInNew sx={{ mr: 1 }} fontSize="small" /> Open Email Client
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TextField
          fullWidth
          label="Your Email Address"
          type="email"
          value={testEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="your@email.com"
          autoFocus
          disabled={isSending}
        />

        <Alert severity="info" sx={{ mt: 2 }}>
          {emailMethod === 'server'
            ? 'We will send an actual email with your signature to preview how it looks.'
            : 'This will open your default email client. Paste (Ctrl+V / Cmd+V) your signature at the end.'}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} startIcon={<Close />} disabled={isSending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSend}
          startIcon={isSending ? <CircularProgress size={16} color="inherit" /> : <Send />}
          disabled={!testEmail || isSending}
        >
          {isSending ? 'Sending...' : emailMethod === 'server' ? 'Send Email' : 'Open Email Client'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestEmailDialog;
