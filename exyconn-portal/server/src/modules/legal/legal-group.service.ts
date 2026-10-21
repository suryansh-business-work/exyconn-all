import { isValidObjectId } from 'mongoose';
import { badRequest } from '../../utils/errors';
import { createCrudService, type CrudService } from '../../lib/crudService';
import { ContractModel } from './legal.model';
import { LegalDocumentModel } from './document.model';
import { PolicyModel } from './policy.model';
import { LegalAssignmentModel } from './legal-assignment.model';
import { LegalGroupModel, type LegalItemKind } from './legal-group.model';

export interface LegalGroupInput {
  name: string;
  kind: LegalItemKind;
  description?: string;
}

/** The model holding each kind's items. */
export const ITEM_MODELS = {
  CONTRACT: ContractModel,
  POLICY: PolicyModel,
  DOCUMENT: LegalDocumentModel,
} as const;

/** Refuses a group that does not exist or holds another kind. Empty means ungrouped. */
export async function assertGroupOf(kind: LegalItemKind, groupId: string | null | undefined) {
  if (!groupId) {
    return;
  }
  const group = isValidObjectId(groupId)
    ? await LegalGroupModel.findById(groupId).select('kind').lean()
    : null;
  if (group?.kind !== kind) {
    badRequest('Choose a group from the list for this kind of item');
  }
}

/** Wraps an item service so every create and update checks the group it names. */
export function withGroupCheck<T extends { groupId?: string | null }>(
  service: CrudService<T>,
  kind: LegalItemKind,
): CrudService<T> {
  return {
    ...service,
    async create(input) {
      await assertGroupOf(kind, input.groupId);
      return service.create({ ...input, groupId: input.groupId || null });
    },
    async update(id, input) {
      if (input.groupId !== undefined) {
        await assertGroupOf(kind, input.groupId);
      }
      return service.update(
        id,
        input.groupId === undefined ? input : { ...input, groupId: input.groupId || null },
      );
    },
    async remove(id) {
      const removed = await service.remove(id);
      // Nobody can be handed an item that no longer exists.
      await LegalAssignmentModel.deleteMany({ kind, itemId: id });
      return removed;
    },
  };
}

const groups = createCrudService<LegalGroupInput>(LegalGroupModel as never, 'LegalGroup');

/** Groups, where deleting one leaves its members in place, ungrouped. */
export const legalGroupService: CrudService<LegalGroupInput> = {
  ...groups,
  async update(id, input) {
    const current = await groups.get(id);
    if (input.kind && input.kind !== (current as { kind: string }).kind) {
      badRequest('A group keeps the kind it was created with');
    }
    return groups.update(id, input);
  },
  async remove(id) {
    const group = (await groups.get(id)) as { kind: LegalItemKind };
    const removed = await groups.remove(id);
    await (ITEM_MODELS[group.kind] as typeof ContractModel).updateMany(
      { groupId: id },
      { $set: { groupId: null } },
    );
    return removed;
  },
};
