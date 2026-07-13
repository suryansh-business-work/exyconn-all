import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { ALL_ROLES, ROLES } from '../../constants/roles';

/** Employment (HR) status, distinct from account access (isActive/isBlocked). */
export const EMPLOYMENT_STATUSES = ['ACTIVE', 'ON_LEAVE', 'TERMINATED'] as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    roles: {
      type: [String],
      enum: ALL_ROLES,
      required: true,
      default: [ROLES.EMPLOYEE],
    },
    avatarUrl: { type: String, default: null },
    isActive: { type: Boolean, required: true, default: true },
    isBlocked: { type: Boolean, required: true, default: false },
    blockReason: { type: String, default: null },
    // HR fields — optional so legacy accounts (e.g. seed admin) stay valid.
    department: { type: String, trim: true, default: null },
    designation: { type: String, trim: true, default: null },
    joinDate: { type: Date, default: null },
    employmentStatus: {
      type: String,
      enum: EMPLOYMENT_STATUSES,
      required: true,
      default: 'ACTIVE',
    },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const UserModel: Model<UserDocument> = model<UserDocument>('User', userSchema);
