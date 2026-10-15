import { useT } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import type { ImportStatus } from './useImportRun';
import { OPTIONS, UPLOAD } from './wizardSteps';

interface ImportActionsProps {
  step: number;
  status: ImportStatus;
  canContinue: boolean;
  cancelling: boolean;
  onBack: () => void;
  onNext: () => void;
  onStart: () => void;
  onCancelRun: () => void;
  onClose: () => void;
}

/** The dialog's buttons for where the wizard is: back/next, start, stop, or close. */
export function ImportActions(props: Readonly<ImportActionsProps>) {
  const t = useT();
  if (props.status === 'running') {
    return (
      <Button color="error" onClick={props.onCancelRun} disabled={props.cancelling}>
        {t('Cancel import')}
      </Button>
    );
  }
  if (props.status === 'done') {
    return (
      <Button variant="contained" onClick={props.onClose}>
        {t('Close')}
      </Button>
    );
  }
  const last = props.step === OPTIONS;
  return (
    <>
      {props.step === UPLOAD ? (
        <Button onClick={props.onClose}>{t('Cancel')}</Button>
      ) : (
        <Button onClick={props.onBack}>{t('Back')}</Button>
      )}
      <Button
        variant="contained"
        disabled={!props.canContinue}
        onClick={last ? props.onStart : props.onNext}
      >
        {last ? t('Start import') : t('Next')}
      </Button>
    </>
  );
}
