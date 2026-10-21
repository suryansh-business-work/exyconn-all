import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertAuthenticated, assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';
import { legalGroupService } from './legal-group.service';
import type { LegalItemKind } from './legal-group.model';
import {
  assignLegalItems,
  employeeLegalAssignments,
  legalAssignables,
  myLegalAssignmentBody,
  myLegalAssignments,
  unassignLegalItem,
} from './legal-assignment.service';

/** Who hands contracts, policies and documents to employees. */
const ASSIGNER_ROLES = [ROLES.HR, ROLES.LEGAL];

const groupResolvers = createCrudResolvers(legalGroupService, {
  name: 'LegalGroup',
  roles: [ROLES.LEGAL],
});

const assigner = (ctx: GraphQLContext) => assertRole(ctx, ASSIGNER_ROLES);

/** Groups of legal items, and handing items to employees (who read theirs on their profile). */
export const legalGroupResolvers = {
  Query: {
    ...groupResolvers.Query,
    legalAssignables: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assigner(ctx);
      return legalAssignables();
    },
    employeeLegalAssignments: (
      _p: unknown,
      { userId }: { userId: string },
      ctx: GraphQLContext,
    ) => {
      assigner(ctx);
      return employeeLegalAssignments(userId);
    },
    myLegalAssignments: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertAuthenticated(ctx);
      return myLegalAssignments(ctx);
    },
    myLegalAssignmentBody: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertAuthenticated(ctx);
      return myLegalAssignmentBody(ctx, id);
    },
  },
  Mutation: {
    ...groupResolvers.Mutation,
    assignLegalItems: (
      _p: unknown,
      { userId, items }: { userId: string; items: { kind: LegalItemKind; itemId: string }[] },
      ctx: GraphQLContext,
    ) => {
      assigner(ctx);
      return assignLegalItems(ctx, userId, items);
    },
    unassignLegalItem: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assigner(ctx);
      return unassignLegalItem(ctx, id);
    },
  },
};
