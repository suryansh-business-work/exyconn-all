import { useState } from 'react';
import EmailIcon from '@mui/icons-material/Email';
import { useT } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useCrmGmailReadyQuery } from '@exyconn/shell/graphql/generated';
import { ComposeEmailForm, type ComposeEmailContext } from '../forms/compose-email';

/** "Email" under a profile, shown once Tech has connected the CRM's Gmail. */
export function EmailButton({ context }: Readonly<{ context: ComposeEmailContext }>) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { data } = useCrmGmailReadyQuery();
  if (!data?.crmGmailReady) {
    return null;
  }
  const close = () => setOpen(false);
  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<EmailIcon />}
        onClick={() => setOpen(true)}
      >
        {t('Email')}
      </Button>
      <CrudDialog open={open} title={t('New email')} onClose={close}>
        {open && <ComposeEmailForm context={context} onDone={close} onCancel={close} />}
      </CrudDialog>
    </>
  );
}
