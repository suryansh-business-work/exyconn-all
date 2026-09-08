import type { ApplicantStage } from '@exyconn/shell/graphql/generated';

/** The applicant being moved — only what the form shows and sends. */
export interface StagedApplicant {
  id: string;
  name: string;
  stage: ApplicantStage;
}

export interface ApplicantStageFormValues {
  stage: ApplicantStage;
  note: string;
}

export interface ApplicantStageFormProps {
  applicant: StagedApplicant;
  onDone: () => void;
  onCancel: () => void;
}
