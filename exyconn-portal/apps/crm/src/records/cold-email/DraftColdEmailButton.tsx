import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import { useT } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ColdEmailDraftForm, type ColdEmailDraftTarget } from './forms/cold-email-draft';
import { coldEmailPath } from './coldEmailPaths';

/** "Draft a cold email" under a contact's or company's profile; opens the new draft when written. */
export function DraftColdEmailButton({ target }: Readonly<{ target: ColdEmailDraftTarget }>) {
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<ForwardToInboxIcon />}
        onClick={() => setOpen(true)}
        sx={{ whiteSpace: 'nowrap' }}
      >
        {t('Draft a cold email')}
      </Button>
      <CrudDialog open={open} title={t('Draft a cold email')} onClose={close}>
        {open && (
          <ColdEmailDraftForm
            target={target}
            onCreated={(id) => {
              close();
              navigate(coldEmailPath(id));
            }}
            onCancel={close}
          />
        )}
      </CrudDialog>
    </>
  );
}
