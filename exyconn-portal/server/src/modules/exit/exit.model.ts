import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Where an exit has reached. Mirrors the offboarding flow HR runs. */
export const EXIT_STAGES = [
  'RESIGNED',
  'APPROVED',
  'NOTICE_PERIOD',
  'CLEARANCE',
  'FULL_AND_FINAL',
  'EXITED',
  'WITHDRAWN',
] as const;

const exitSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    resignationDate: { type: Date, required: true },
    /** Agreed last day, which can differ from resignation + notice. */
    lastWorkingDate: { type: Date, default: null },
    noticePeriodDays: { type: Number, required: true, min: 0, default: 0 },
    reason: { type: String, default: '' },
    stage: { type: String, enum: EXIT_STAGES, required: true, default: 'RESIGNED' },
    assetsReturned: { type: Boolean, required: true, default: false },
    knowledgeTransferDone: { type: Boolean, required: true, default: false },
    exitInterviewNotes: { type: String, default: '' },
    finalSettlementAmount: { type: Number, default: null, min: 0 },
    /** Relieving/experience letters handed over. */
    documentsIssued: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

exitSchema.index({ employeeId: 1, resignationDate: -1 });

export type ExitRecordDocument = InferSchemaType<typeof exitSchema>;
export const ExitRecordModel: Model<ExitRecordDocument> = model<ExitRecordDocument>(
  'ExitRecord',
  exitSchema,
);
