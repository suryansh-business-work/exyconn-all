import type { TableFileFormat } from '@exyconn/shell/graphql/generated';
import type { ImportFieldOption, ImportFile, ImportModeOption } from './import.types';
import type { ColumnMapping } from './mapping';
import { MapStep } from './steps/MapStep';
import { OptionsStep } from './steps/OptionsStep';
import { ProgressStep } from './steps/ProgressStep';
import { ResultStep } from './steps/ResultStep';
import { UploadStep } from './steps/UploadStep';
import type { ImportRunState } from './useImportRun';
import { MAP, OPTIONS, RUNNING } from './wizardSteps';

interface ImportStepProps<Mode extends string> {
  step: number;
  file: ImportFile | null;
  mapping: ColumnMapping;
  mode: Mode;
  modes: readonly ImportModeOption<Mode>[];
  fields: readonly ImportFieldOption[];
  matchLabel: string | null;
  run: ImportRunState;
  cancelling: boolean;
  templateFormats: readonly TableFileFormat[];
  onFile: (file: ImportFile) => void;
  onDownloadTemplate: (format: TableFileFormat) => void;
  onAssign: (column: number, key: string | null) => void;
  onModeChange: (mode: Mode) => void;
  onDownloadIssues: () => void;
}

/** The body of the wizard's current step. */
export function ImportStep<Mode extends string>(props: Readonly<ImportStepProps<Mode>>) {
  const { step, file } = props;
  if (step === MAP && file) {
    return (
      <MapStep
        file={file}
        mapping={props.mapping}
        fields={props.fields}
        onAssign={props.onAssign}
      />
    );
  }
  if (step === OPTIONS) {
    return (
      <OptionsStep
        mode={props.mode}
        modes={props.modes}
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
    <UploadStep
      file={file}
      onFile={props.onFile}
      templateFormats={props.templateFormats}
      onDownloadTemplate={props.onDownloadTemplate}
    />
  );
}
