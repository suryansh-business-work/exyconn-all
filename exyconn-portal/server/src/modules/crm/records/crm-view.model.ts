import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { CRM_OBJECTS } from './crm.objects';

/**
 * A saved view of a CRM list: its filters, sort, search and columns, like a HubSpot view tab.
 * Its owner sees and edits it; `shared` shows it to everyone who can open that list. The
 * filters are stored as the query input they were saved with and checked again on every read,
 * so a view naming a property that was since deleted still opens.
 */
const crmViewSchema = new Schema(
  {
    object: { type: String, enum: CRM_OBJECTS, required: true },
    name: { type: String, required: true, trim: true },
    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String, default: '' },
    shared: { type: Boolean, required: true, default: false },
    search: { type: String, default: '' },
    groups: { type: Schema.Types.Mixed, default: [] },
    sorts: { type: Schema.Types.Mixed, default: [] },
    /** Property keys shown as columns, in order. Empty shows the default columns. */
    columns: { type: [String], default: [] },
  },
  { timestamps: true },
);
crmViewSchema.index({ object: 1, shared: 1 });

export type CrmViewDocument = InferSchemaType<typeof crmViewSchema>;
export const CrmViewModel: Model<CrmViewDocument> = model<CrmViewDocument>(
  'CrmView',
  crmViewSchema,
);
