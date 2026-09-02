import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  Flex,
  Text,
} from '@exyconn/shell/components/ui';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';

export interface Credentials {
  name: string;
  email: string;
  password: string;
}

/** A copyable credential field: label, monospace value, and a copy button. */
function Field({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 1.5, py: 1 }}>
      <Text size="caption" color="text.secondary">
        {label}
      </Text>
      <Flex direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Text sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{value}</Text>
        <Tooltip title={`Copy ${label.toLowerCase()}`}>
          <IconButton size="small" aria-label={`copy ${label}`} onClick={onCopy}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Flex>
    </Box>
  );
}

interface CredentialsDialogProps {
  credentials: Credentials | null;
  onClose: () => void;
}

/**
 * One-time reveal of a user's login credentials (shown after create or reset).
 * The password is never persisted in plaintext — it can only be copied here or
 * regenerated via a reset, so this is the single chance to hand it over.
 */
export function CredentialsDialog({ credentials, onClose }: CredentialsDialogProps) {
  const notify = useNotify();
  if (!credentials) return null;

  const { name, email, password } = credentials;
  const copy = async (label: string, value: string) => {
    notify((await copyToClipboard(value)) ? `${label} copied` : 'Copy failed', 'info');
  };
  const copyBoth = () => copy('Credentials', `Email: ${email}\nPassword: ${password}`);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Credentials for {name}</DialogTitle>
      <DialogContent>
        <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Share these with the user (also emailed when SMTP is configured). The password is shown
          only once — copy it now.
        </Text>
        <Flex direction="column" spacing={1.5}>
          <Field label="Email" value={email} onCopy={() => copy('Email', email)} />
          <Field label="Password" value={password} onCopy={() => copy('Password', password)} />
        </Flex>
      </DialogContent>
      <DialogActions>
        <Button onClick={copyBoth} startIcon={<ContentCopyIcon />}>
          Copy both
        </Button>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
