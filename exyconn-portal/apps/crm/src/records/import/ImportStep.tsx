import type { CrmImportMode } from '@exyconn/shell/graphql/generated';
import type { CrmPropertyInfo } from '../schema';
import type { CsvFile } from './csvFile';
import type { ColumnMapping } from './mapping';
import { MapStep } from './steps/MapStep';
import { OptionsStep } from './steps/OptionsStep';
import { ProgressStep } from './steps/ProgressStep';
import { ResultStep } from './steps/ResultStep';
import { UploadStep } from './steps/UploadStep';
import type { ImportRunState } from './useImportRun';
import { MAP, OPTIONS, RUNNING } from './wizardSteps';

interface ImportStepProps {
  step: number;
  file: CsvFile | null;
  mapping: ColumnMapping;
  mode: CrmImportMode;
  properties: readonly CrmPropertyInfo[];
  matchLabel: string;
  run: ImportRunState;
  cancelling: boolean;
  onFile: (file: CsvFile) => void;
  onDownloadTemplate: () => void;
  onAssign: (column: number, key: string | null) => void;
  onModeChange: (mode: CrmImportMode) => void;
  onDownloadIssues: () => void;
}

/** The body of the wizard's current step. */
export function ImportStep(props: Readonly<ImportStepProps>) {
  const { step, file } = props;
  if (step === MAP && file) {
    return (
      <MapStep
        file={file}
        mapping={props.mapping}
        properties={props.properties}
        onAssign={props.onAssign}
      />
    );
  }
  if (step === OPTIONS) {
    return (
      <OptionsStep
        mode={props.mode}
        matchLabel={props.matchLabel}
        onModeChange={props.onModeChange}
      />
    );
  }
  if (step === RUNNING) {
    return (
      <ProgressStep done={props.run.done} total={props.run.total} cancelling={props.cancelling} />
    );
  }
  if (step > RUNNING) {
    return <ResultStep state={props.run} onDownloadIssues={props.onDownloadIssues} />;
  }
  return (
    <UploadStep file={file} onFile={props.onFile} onDownloadTemplate={props.onDownloadTemplate} />
  );
}
