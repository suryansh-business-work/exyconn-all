import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A bucket the company budgets and reports spend against — a department, a team, a site.
 *
 * Deliberately its own record rather than reusing the HR department list: finance budgets
 * against things HR has no row for (a product line, a client programme, "unallocated"), and
 * tying the two together would mean closing a department could not happen without deciding
 * what to do with three years of spend history booked to it.
 */
const costCenterSchema = new Schema(
  {
    /** Short human key finance actually quotes — "ENG", "MKT-APAC". */
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    /** User id of whoever answers for this centre's spend. Empty while nobody owns it. */
    ownerId: { type: String, default: '', trim: true },
    /**
     * Retired centres stay readable. Deleting one would silently detach every expense and
     * budget booked to it, and last year's report would quietly change.
     */
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export type CostCenterDocument = InferSchemaType<typeof costCenterSchema>;
export const CostCenterModel: Model<CostCenterDocument> = model<CostCenterDocument>(
  'CostCenter',
  costCenterSchema,
);
