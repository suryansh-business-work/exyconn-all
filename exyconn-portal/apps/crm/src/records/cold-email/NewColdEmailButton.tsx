import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import { useT } from '@exyconn/i18n';
import { Button, Flex } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ColdEmailDraftForm } from './forms/cold-email-draft';
import { ColdEmailRecordPicker } from './ColdEmailRecordPicker';
import type { ColdEmailObject, ColdEmailRecordOption } from './useColdEmailRecordOptions';
import { coldEmailPath } from './coldEmailPaths';

/**
 * "Draft a cold email" on CRM > Cold emails: pick a contact or company first, then the same
 * form as on their profile; opens the new draft when it is written.
 */
export function NewColdEmailButton() {
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [object, setObject] = useState<ColdEmailObject>('CONTACT');
  const [record, setRecord] = useState<ColdEmailRecordOption | null>(null);
  const close = () => {
    setOpen(false);
    setRecord(null);
  };
  const switchObject = (next: ColdEmailObject) => {
    setObject(next);
    setRecord(null);
  };
  return (
    <>
      <Button variant="contained" startIcon={<ForwardToInboxIcon />} onClick={() => setOpen(true)}>
        {t('Draft a cold email')}
      </Button>
      <CrudDialog open={open} title={t('Draft a cold email')} onClose={close}>
        <Flex direction="column" spacing={3}>
          <ColdEmailRecordPicker
            object={object}
            onObjectChange={switchObject}
            value={record}
            onChange={setRecord}
          />
          {record && (
            <ColdEmailDraftForm
              key={record.id}
              target={record}
              onCreated={(id) => {
                close();
                navigate(coldEmailPath(id));
              }}
              onCancel={close}
            />
          )}
        </Flex>
      </CrudDialog>
    </>
  );
}
