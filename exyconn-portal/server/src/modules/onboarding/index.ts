import {
  OnboardingChecklistModel,
  OnboardingTemplateModel,
  progressPercent,
  type OnboardingOwner,
} from './onboarding.model';
import { onboardingTypeDefs } from './onboarding.typeDefs';
import { setOnboardingItem, startOnboarding } from './onboarding.service';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertAuthenticated, assertRole } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import { notFound } from '../../utils/errors';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';

interface OnboardingTemplateInput {
  name: string;
  active: boolean;
  tasks: Array<{
    key: string;
    label: string;
    owner: OnboardingOwner;
    dueDaysFromJoin: number;
  }>;
}

const templateCrud = createCrudResolvers(
  createCrudService<OnboardingTemplateInput>(
    OnboardingTemplateModel as never,
    'OnboardingTemplate',
  ),
  {
    name: 'OnboardingTemplate',
    roles: [ROLES.HR],
    table: {
      searchFields: ['name'],
      filterFields: ['name', 'active'],
      sortFields: ['name', 'active', 'createdAt'],
      defaultSort: { field: 'name', dir: 'ASC' },
    },
    stats: { countBy: ['active'] },
  },
);

/**
 * Checklists get their own resolvers rather than the CRUD kit's: they are made by
 * `startOnboarding` and changed one item at a time, so a generic create or update would be
 * a second, unguarded way to write the same record.
 */
const checklistService = createCrudService<never>(
  OnboardingChecklistModel as never,
  'OnboardingChecklist',
);

const CHECKLIST_TABLE = {
  searchFields: ['employeeName', 'templateName'],
  filterFields: ['employeeId', 'templateName'],
  sortFields: ['employeeName', 'templateName', 'joinDate', 'createdAt'],
  defaultSort: { field: 'joinDate', dir: 'DESC' as const },
};

const hrOnly = [ROLES.HR];

export const onboardingResolvers = {
  Query: {
    ...templateCrud.Query,
    listOnboardingChecklistsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, hrOnly);
      const page = await checklistService.paged(input, CHECKLIST_TABLE);
      return { rows: withIds(page.rows as { _id: unknown }[]), totalCount: page.totalCount };
    },
    listOnboardingChecklistsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, hrOnly);
      return checklistService.stats({ countBy: ['templateName'] });
    },
    /** The signed-in employee's own checklist — the newest, if HR ever started a second. */
    myOnboarding: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const row = await OnboardingChecklistModel.findOne({ employeeId: user.id })
        .sort({ createdAt: -1 })
        .lean();
      return row ? withId(row as { _id: unknown }) : null;
    },
  },
  Mutation: {
    ...templateCrud.Mutation,
    startOnboarding: async (
      _p: unknown,
      { employeeId, templateId }: { employeeId: string; templateId: string },
      ctx: GraphQLContext,
    ) => withId((await startOnboarding(employeeId, templateId, ctx)).toObject()),
    setOnboardingItem: async (
      _p: unknown,
      args: { checklistId: string; key: string; done: boolean; notes?: string | null },
      ctx: GraphQLContext,
    ) =>
      withId(
        (
          await setOnboardingItem(args.checklistId, args.key, args.done, args.notes, ctx)
        ).toObject(),
      ),
    deleteOnboardingChecklist: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, hrOnly);
      const removed = await OnboardingChecklistModel.findByIdAndDelete(id).lean();
      if (!removed) notFound('Onboarding checklist');
      return true;
    },
  },
  OnboardingTemplate: {
    taskCount: (template: { tasks?: unknown[] }) => template.tasks?.length ?? 0,
  },
  OnboardingChecklist: {
    progressPercent: (checklist: { items: Array<{ done: boolean }> }) =>
      progressPercent(checklist.items),
    complete: (checklist: { items: Array<{ done: boolean }> }) =>
      progressPercent(checklist.items) === 100,
  },
};

export { onboardingTypeDefs, OnboardingChecklistModel, OnboardingTemplateModel };
export { ensureOnboardingDefaults } from './onboarding.defaults';
