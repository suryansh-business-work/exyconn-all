import type { ListExitRecordsPagedQuery, ExitStage } from '@exyconn/shell/graphql/generated';

export type ExitRecordRow = ListExitRecordsPagedQuery['listExitRecordsPaged']['rows'][number];

export interface ExitRecordFormValues {
  employeeId: string;
  resignationDate: string;
  lastWorkingDate: string;
  noticePeriodDays: number | string;
  reason: string;
  stage: ExitStage;
  assetsReturned: string;
  knowledgeTransferDone: string;
  exitInterviewNotes: string;
  finalSettlementAmount: number | string;
  documentsIssued: string;
}
