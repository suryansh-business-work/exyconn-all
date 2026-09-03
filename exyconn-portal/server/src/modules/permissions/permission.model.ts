import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { ALL_ROLES } from '../../constants/roles';

export const PERMISSION_ACTIONS = [
  'VIEW',
  'CREATE',
  'EDIT',
  'DELETE',
  'APPROVE',
  'EXPORT',
] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/**
 * What a role may do inside one module. A missing row means "everything" — the
 * behaviour the portal had before permissions existed — so adding this model
 * changed nothing until an administrator restricts something.
 */
const permissionSchema = new Schema(
  {
    role: { type: String, enum: ALL_ROLES, required: true },
    /** The CRUD module's singular name, e.g. "Goal", "Announcement". */
    module: { type: String, required: true, trim: true },
    actions: { type: [String], enum: PERMISSION_ACTIONS, required: true, default: [] },
  },
  { timestamps: true },
);

permissionSchema.index({ role: 1, module: 1 }, { unique: true });

export type RolePermissionDocument = InferSchemaType<typeof permissionSchema>;
export const RolePermissionModel: Model<RolePermissionDocument> = model<RolePermissionDocument>(
  'RolePermission',
  permissionSchema,
);
