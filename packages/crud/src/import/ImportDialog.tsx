import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Step,
  StepLabel,
  Stepper,
} from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import type { TableFileFormat } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { ImportActions } from './ImportActions';
import type { ImportFile, ImportSource } from './import.types';
import { downloadIssuesCsv } from './issuesCsv';
import { assignColumn, autoMap, buildRow, unmappedRequired, type ColumnMapping } from './mapping';
import { ImportStep } from './ImportStep';
import { useImportRun } from './useImportRun';
import { activeStep, MAP, STEP_LABELS, UPLOAD } from './wizardSteps';

interface ImportDialogProps<Mode extends string> {
  source: ImportSource<Mode>;
  /** Runs after every chunk the server accepted, so the list behind can refetch. */
  onImported: () => void;
  onClose: () => void;
}

/**
 * The import wizard every list shares: upload a CSV or Excel file, map its columns to fields,
 * choose what matching does, run, and read the results — with the rows that failed as a CSV.
 */
export function ImportDialog<Mode extends string>({
  source,
  onImported,
  onClose,
}: Readonly<ImportDialogProps<Mode>>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [step, setStep] = useState(UPLOAD);
  const [file, setFile] = useState<ImportFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>([]);
  const [mode, setMode] = useState<Mode>(source.modes[0].mode);
  const [cancelling, setCancelling] = useState(false);
  const run = useImportRun(source, onImported);
  const { status } = run.state;
  const canContinue =
    step === MAP ? unmappedRequired(mapping, source.fields).length === 0 : file !== null;

  const chooseFile = (chosen: ImportFile) => {
    setFile(chosen);
    setMapping(autoMap(chosen.headers, source.fields, source.synonyms));
  };

  // Start (the Options step) and the issues download (the Results step) are only reachable
  // once a file was read: Upload's Next stays disabled without one, and it is never cleared.
  const start = () => {
    const rows = (file as ImportFile).rows.map((cells) => buildRow(cells, mapping));
    run.start(rows, mode);
  };

  const downloadTemplate = (format: TableFileFormat) => {
    source.downloadTemplate(format).catch((failure: unknown) => {
      portalLogger.error('Downloading an import sample failed', failure);
      notify(errorMessage(failure, t('The sample file could not be downloaded.')), 'error');
    });
  };

  const close = async () => {
    if (status === 'running') {
      const stop = await confirm({
        title: 'Stop the import?',
        message:
          'Rows already imported stay imported. The import stops after the rows being sent now.',
        confirmText: 'Stop import',
        cancelText: 'Keep importing',
        destructive: true,
      });
      if (!stop) {
        return;
      }
      run.cancel();
    }
    onClose();
  };

  const requestClose = () => {
    close().catch((failure: unknown) => portalLogger.error('Closing an import failed', failure));
  };

  const downloadIssues = () => {
    downloadIssuesCsv(file as ImportFile, run.state.issues, { line: t('Line'), issue: t('Issue') });
  };

  return (
    <Dialog open fullWidth maxWidth="md" onClose={requestClose} aria-labelledby="import-title">
      <DialogTitle id="import-title">{source.title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Stepper activeStep={activeStep(step, status)} alternativeLabel>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{t(label)}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {source.loadError && <Alert severity="error">{source.loadError}</Alert>}
          <ImportStep
            step={activeStep(step, status)}
            file={file}
            mapping={mapping}
            mode={mode}
            modes={source.modes}
            fields={source.fields}
            matchLabel={source.matchLabel}
            run={run.state}
            cancelling={cancelling}
            templateFormats={source.templateFormats}
            onFile={chooseFile}
            onDownloadTemplate={downloadTemplate}
            onAssign={(column, key) => setMapping((current) => assignColumn(current, column, key))}
            onModeChange={setMode}
            onDownloadIssues={downloadIssues}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <ImportActions
          step={step}
          status={status}
          canContinue={canContinue}
          cancelling={cancelling}
          onBack={() => setStep((current) => current - 1)}
          onNext={() => setStep((current) => current + 1)}
          onStart={start}
          onCancelRun={() => {
            setCancelling(true);
            run.cancel();
          }}
          onClose={requestClose}
        />
      </DialogActions>
    </Dialog>
  );
}
