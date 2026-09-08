import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Who is expected to do an onboarding task.
 *
 * The owner is what decides who may tick the task off, so it is part of the record rather
 * than a label: an employee may confirm they signed the policies, and nobody else may
 * confirm it on their behalf.
 */
export const ONBOARDING_OWNERS = ['HR', 'IT', 'MANAGER', 'EMPLOYEE'] as const;
export type OnboardingOwner = (typeof ONBOARDING_OWNERS)[number];

/** One task as a template describes it, before it belongs to anybody. */
const templateTaskSchema = new Schema(
  {
    /** Stable identifier the checklist is ticked by; unique inside one template. */
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    owner: { type: String, enum: ONBOARDING_OWNERS, required: true, default: 'HR' },
    /** Days after the join date this task is due. 0 means the first day. */
    dueDaysFromJoin: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const onboardingTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    active: { type: Boolean, required: true, default: true },
    tasks: { type: [templateTaskSchema], required: true, default: [] },
  },
  { timestamps: true },
);

export type OnboardingTemplateDocument = InferSchemaType<typeof onboardingTemplateSchema>;
export const OnboardingTemplateModel: Model<OnboardingTemplateDocument> =
  model<OnboardingTemplateDocument>('OnboardingTemplate', onboardingTemplateSchema);

/**
 * One task as it belongs to one joiner.
 *
 * The label and owner are copied from the template rather than referenced, so editing a
 * template never rewrites what somebody who joined last month was actually asked to do.
 */
const checklistItemSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    owner: { type: String, enum: ONBOARDING_OWNERS, required: true, default: 'HR' },
    dueOn: { type: Date, required: true },
    done: { type: Boolean, required: true, default: false },
    doneAt: { type: Date, default: null },
    /** Who ticked it, denormalised, so the record still reads right after they leave. */
    doneByName: { type: String, trim: true, default: null },
    notes: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const onboardingChecklistSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    /** Denormalised so the HR grid names the joiner without a lookup per row. */
    employeeName: { type: String, required: true, trim: true },
    templateName: { type: String, required: true, trim: true },
    joinDate: { type: Date, required: true },
    items: { type: [checklistItemSchema], required: true, default: [] },
  },
  { timestamps: true },
);

export type OnboardingChecklistDocument = InferSchemaType<typeof onboardingChecklistSchema>;
export const OnboardingChecklistModel: Model<OnboardingChecklistDocument> =
  model<OnboardingChecklistDocument>('OnboardingChecklist', onboardingChecklistSchema);

/** How far through a checklist is, 0-100. An empty checklist is complete, not stuck at zero. */
export function progressPercent(items: Array<{ done: boolean }>): number {
  if (items.length === 0) return 100;
  return Math.round((items.filter((item) => item.done).length / items.length) * 100);
}
