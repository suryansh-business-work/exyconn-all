import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import SearchIcon from '@mui/icons-material/Search';
import { useT } from '@exyconn/i18n';
import { Box, Button } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { emailCheckSchema, type EmailCheckValues } from './email-check.types';

interface EmailCheckFormProps {
  checking: boolean;
  onCheck: (email: string) => void;
}

/** One address to check now. */
export function EmailCheckForm({ checking, onCheck }: Readonly<EmailCheckFormProps>) {
  const t = useT();
  const form = useForm<EmailCheckValues>({
    resolver: zodResolver(emailCheckSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });
  return (
    <FormProvider {...form}>
      <Box
        component="form"
        noValidate
        sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}
        onSubmit={form.handleSubmit((values) => onCheck(values.email))}
      >
        <RhfTextField
          name="email"
          label="Email address"
          type="email"
          autoComplete="off"
          helperText="We ask the domain's mail server whether the mailbox exists. Nothing is sent."
          sx={{ flex: '1 1 320px' }}
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<SearchIcon />}
          disabled={checking}
          sx={{ mt: 1 }}
        >
          {checking ? t('Checking…') : t('Check')}
        </Button>
      </Box>
    </FormProvider>
  );
}
