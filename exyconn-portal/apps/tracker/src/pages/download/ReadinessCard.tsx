import { Box, Chip, Stack, Typography } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';

interface ReadinessItem {
  key: string;
  label: string;
  done: boolean;
  hint: string;
}

interface ReadinessCardProps {
  hasAccess: boolean;
  consented: boolean;
  loading: boolean;
}

/** Builds the three checks in the order an employee actually completes them. */
function buildItems(hasAccess: boolean, consented: boolean): ReadinessItem[] {
  return [
    {
      key: 'access',
      label: 'Tracker access granted',
      done: hasAccess,
      hint: hasAccess
        ? 'Your account may run the desktop tracker.'
        : 'Ask your manager to grant access — the app will refuse to sign you in until they do.',
    },
    {
      key: 'install',
      label: 'App installed and signed in',
      done: false,
      hint: 'Sign in with the same email and password you use for this portal.',
    },
    {
      key: 'consent',
      label: 'Consent accepted',
      done: consented,
      hint: consented
        ? 'You have accepted what the app records.'
        : 'The app shows a consent screen on first run; nothing is recorded until you accept it.',
    },
  ];
}

/** Where the signed-in employee stands before installing — read from their own access row. */
export function ReadinessCard({ hasAccess, consented, loading }: Readonly<ReadinessCardProps>) {
  const items = buildItems(hasAccess, consented);
  return (
    <Box sx={[glass, { p: 2, mb: 1.5 }]}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1">Before you start</Typography>
        {loading && <Chip size="small" variant="outlined" label="Checking…" />}
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {items.map((item) => (
          <Stack key={item.key} direction="row" spacing={1.25} sx={{ flex: 1 }}>
            {item.done ? (
              <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
            ) : (
              <PendingIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
            )}
            <Box>
              <Typography variant="subtitle2">{item.label}</Typography>
              <Typography variant="caption" color="text.secondary">
                {item.hint}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
