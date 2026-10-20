import { useT } from '@exyconn/i18n';
import ExtensionIcon from '@mui/icons-material/Extension';
import {
  Alert,
  Box,
  Button,
  Flex,
  List,
  ListItem,
  ListItemText,
  Text,
  Typography,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { IconBubble } from '@exyconn/shell/components/dashboard/IconBubble';
import { color } from '@exyconn/ui';

/** What signing the extension in lets it do. */
const ABILITIES = [
  'See your name, email and company',
  'Record the Google Meet calls you start recording, and save their transcript',
  'Read your meeting notes and action items',
  'Show reminders while you are in a call',
] as const;

interface ConsentCardProps {
  email: string;
  submitting: boolean;
  /** The server's reason the sign-in failed, shown as it came. */
  failure: string | null;
  onAllow: () => void;
  onCancel: () => void;
}

/** "Exyconn Meeting Assistant wants to access your meetings" — Allow or Cancel. */
export function ConsentCard({
  email,
  submitting,
  failure,
  onAllow,
  onCancel,
}: Readonly<ConsentCardProps>) {
  const t = useT();
  return (
    <Box sx={[panel, { maxWidth: 560, mx: 'auto' }]}>
      <Flex direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <IconBubble icon={ExtensionIcon} accent={color.indigo[400]} />
        <Typography variant="h5" component="h1">
          {t('Exyconn Meeting Assistant wants to access your meetings as {email}', { email })}
        </Typography>
      </Flex>
      <Text size="sm" color="text.secondary">
        {t('If you allow it, the extension can:')}
      </Text>
      <List dense sx={{ listStyleType: 'disc', pl: 3 }}>
        {ABILITIES.map((ability) => (
          <ListItem key={ability} sx={{ display: 'list-item', py: 0 }}>
            <ListItemText primary={t(ability)} />
          </ListItem>
        ))}
      </List>
      <Alert severity="info" sx={{ my: 2 }}>
        {t(
          'Recording starts only when you click Start in the extension. Tell everyone in the call that it is being recorded and transcribed.',
        )}
      </Alert>
      {failure && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {failure}
        </Alert>
      )}
      <Flex direction="row" spacing={1} justifyContent="flex-end">
        <Button color="inherit" onClick={onCancel} disabled={submitting}>
          {t('Cancel')}
        </Button>
        <Button variant="contained" onClick={onAllow} loading={submitting}>
          {t('Allow')}
        </Button>
      </Flex>
    </Box>
  );
}
