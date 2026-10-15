import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { CRM_OBJECTS, PROPERTY_TYPES } from './crm.objects';

/**
 * A property a company added to its leads, companies or contacts (CRM > Settings > Properties).
 * Its values live on each record under `custom.<key>`; the key is fixed once created, and so is
 * the type, because stored values were written for it.
 */
const optionSchema = new Schema(
  {
    value: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const crmPropertySchema = new Schema(
  {
    object: { type: String, enum: CRM_OBJECTS, required: true },
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: PROPERTY_TYPES, required: true },
    /** The choices of an ENUM property. */
    options: { type: [optionSchema], default: [] },
    required: { type: Boolean, required: true, default: false },
    description: { type: String, default: '', trim: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);
crmPropertySchema.index({ object: 1, key: 1 }, { unique: true });

export type CrmPropertyDocument = InferSchemaType<typeof crmPropertySchema>;
export const CrmPropertyModel: Model<CrmPropertyDocument> = model<CrmPropertyDocument>(
  'CrmProperty',
  crmPropertySchema,
);
