import { useMemo, useState } from 'react';
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
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { CrmImportMode, type CrmObject } from '@exyconn/shell/graphql/generated';
import { useObjectSchema } from '../schema';
import { downloadTemplate, type CsvFile } from './csvFile';
import { ImportActions } from './ImportActions';
import { downloadIssuesCsv } from './issuesCsv';
import {
  assignColumn,
  autoMap,
  buildRow,
  importableProperties,
  unmappedRequired,
  type ColumnMapping,
} from './mapping';
import { propertyLabel } from '../propertyText';
import { ImportStep } from './ImportStep';
import { useImportRun } from './useImportRun';
import { activeStep, MAP, STEP_LABELS, UPLOAD } from './wizardSteps';

interface ImportDialogProps {
  object: CrmObject;
  onImported: () => void;
  onClose: () => void;
}

/** The import wizard: upload, map, choose what matching does, run, and read the results. */
export function ImportDialog({ object, onImported, onClose }: Readonly<ImportDialogProps>) {
  const t = useT();
  const confirm = useConfirm();
  const { properties: all, dedupeKey, error: schemaError } = useObjectSchema(object);
  const properties = useMemo(() => importableProperties(all), [all]);
  const [step, setStep] = useState(UPLOAD);
  const [file, setFile] = useState<CsvFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>([]);
  const [mode, setMode] = useState<CrmImportMode>(CrmImportMode.Upsert);
  const [cancelling, setCancelling] = useState(false);
  const run = useImportRun(object, onImported);
  const { status } = run.state;
  const shown = activeStep(step, status);

  const dedupe = all.find((property) => property.key === dedupeKey);
  const canContinue =
    step === MAP ? unmappedRequired(mapping, properties).length === 0 : file !== null;
  const labels = properties.map((property) => propertyLabel(t, property));

  const chooseFile = (chosen: CsvFile) => {
    setFile(chosen);
    setMapping(autoMap(chosen.headers, properties, t));
  };

  const start = () => {
    if (!file) {
      return;
    }
    run
      .start(
        file.rows.map((cells) => buildRow(cells, mapping)),
        mode,
      )
      .catch((failure: unknown) => portalLogger.error('Starting a CRM import failed', failure));
  };

  const cancelRun = () => {
    setCancelling(true);
    run.cancel();
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
    close().catch((failure: unknown) =>
      portalLogger.error('Closing the CRM import failed', failure),
    );
  };

  const downloadIssues = () => {
    if (file) {
      downloadIssuesCsv(file, run.state.issues, { line: t('Line'), issue: t('Issue') });
    }
  };

  return (
    <Dialog open fullWidth maxWidth="md" onClose={requestClose} aria-labelledby="crm-import-title">
      <DialogTitle id="crm-import-title">{t('Import from CSV')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Stepper activeStep={shown} alternativeLabel>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{t(label)}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {schemaError && (
            <Alert severity="error">{t('The properties could not be loaded.')}</Alert>
          )}
          <ImportStep
            step={shown}
            file={file}
            mapping={mapping}
            mode={mode}
            properties={properties}
            matchLabel={dedupe ? propertyLabel(t, dedupe) : dedupeKey}
            run={run.state}
            cancelling={cancelling}
            onFile={chooseFile}
            onDownloadTemplate={() =>
              downloadTemplate(`${object.toLowerCase()}-import-template`, labels)
            }
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
          onCancelRun={cancelRun}
          onClose={requestClose}
        />
      </DialogActions>
    </Dialog>
  );
}
