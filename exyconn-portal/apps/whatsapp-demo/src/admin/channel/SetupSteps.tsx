import { useT } from '@exyconn/i18n';
import { Box, Stack, TextField, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';

interface SetupStepsProps {
  webhookUrl: string;
  verifyToken: string | null;
}

/** The steps in Meta's dashboard, in the order they are done. English sources, translated. */
const STEPS = [
  'In Meta for Developers, create a Business app and add the WhatsApp product.',
  'Under WhatsApp > API Setup, copy the Phone number ID. With the test number, add the phones that may message it (up to five).',
  'Create a permanent access token for a System User with the whatsapp_business_messaging permission, and copy the App secret from App settings > Basic.',
  'Save the form below, then under WhatsApp > Configuration set the Callback URL and Verify token shown here, and subscribe to the messages field.',
  'Send "hi" to the number from WhatsApp. You get the industry list; pick one and the bot answers with its published workflows.',
] as const;

/** A value to paste into Meta, selectable and read-only. */
function CopyField({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <TextField
      label={label}
      value={value}
      fullWidth
      size="small"
      slotProps={{
        htmlInput: {
          readOnly: true,
          onFocus: (e: { target: HTMLInputElement }) => e.target.select(),
        },
      }}
    />
  );
}

/** How to connect a real number, with the two values Meta asks for. */
export function SetupSteps({ webhookUrl, verifyToken }: Readonly<SetupStepsProps>) {
  const t = useT();
  return (
    <Box sx={panel} component="section" aria-labelledby="wa-setup-title">
      <Stack spacing={2}>
        <Typography id="wa-setup-title" variant="h6" component="h2">
          {t('Connect a real WhatsApp number')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(
            'People who message the number chat with the same published bot workflows as this demo, on WhatsApp itself.',
          )}
        </Typography>
        <Box component="ol" sx={{ m: 0, pl: 3 }}>
          {STEPS.map((step) => (
            <Typography key={step} component="li" variant="body2" sx={{ mb: 1 }}>
              {t(step)}
            </Typography>
          ))}
        </Box>
        <CopyField label={t('Callback URL')} value={webhookUrl} />
        {verifyToken && <CopyField label={t('Verify token')} value={verifyToken} />}
      </Stack>
    </Box>
  );
}
