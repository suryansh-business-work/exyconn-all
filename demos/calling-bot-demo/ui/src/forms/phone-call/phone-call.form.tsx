import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';
import { useT } from '@exyconn/i18n';
import { Box, Button } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { phoneCallSchema, type PhoneCallValues } from './phone-call.types';

interface PhoneCallFormProps {
  /** The visitor's own number, offered first when it is already in E.164. */
  defaultPhone: string;
  busy: boolean;
  onCall: (phone: string) => void;
}

/** The number for the bot to ring, and the button that rings it. */
export function PhoneCallForm({ defaultPhone, busy, onCall }: Readonly<PhoneCallFormProps>) {
  const t = useT();
  const form = useForm<PhoneCallValues>({
    resolver: zodResolver(phoneCallSchema),
    defaultValues: { phone: defaultPhone },
    mode: 'onTouched',
  });
  return (
    <FormProvider {...form}>
      <Box
        component="form"
        noValidate
        sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}
        onSubmit={form.handleSubmit((values) => onCall(values.phone))}
      >
        <RhfTextField
          name="phone"
          label="Your phone number"
          placeholder="+919876543210"
          helperText="With the country code. The bot calls you within a few seconds."
          inputMode="tel"
          autoComplete="tel"
          sx={{ flex: '1 1 220px' }}
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<PhoneForwardedIcon />}
          disabled={busy}
          sx={{ mt: 1 }}
        >
          {t('Call me')}
        </Button>
      </Box>
    </FormProvider>
  );
}
