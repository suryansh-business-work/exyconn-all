import { ROLES } from '../../constants/roles';
import { assertPermission } from '../../lib/permissions';
import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';
import { assertCompanyCrm } from '../gmail/gmail.crm';
import { checkDomainHealth, listDomainHealth, type DomainHealth } from './mail-health.service';

/** The same right the mailbox list itself needs (see the Gmail and Microsoft resolvers). */
const crmMailbox = async (ctx: GraphQLContext, action: PermissionAction) => {
  await assertPermission(ctx, 'Activity', [ROLES.CRM], action);
  assertCompanyCrm();
};

const present = ({ health, ...entry }: DomainHealth) => ({
  ...entry,
  score: health?.score ?? null,
  previousScore: health?.previousScore ?? null,
  checkedAt: health?.checkedAt ?? null,
  checks: health?.checks ?? [],
});

export const mailHealthResolvers = {
  Query: {
    mailDomainHealth: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crmMailbox(ctx, 'VIEW');
      return (await listDomainHealth()).map(present);
    },
  },
  Mutation: {
    checkMailDomainHealth: async (
      _p: unknown,
      { domain }: { domain: string },
      ctx: GraphQLContext,
    ) => {
      await crmMailbox(ctx, 'VIEW');
      return present(await checkDomainHealth(domain.trim().toLowerCase()));
    },
  },
};
