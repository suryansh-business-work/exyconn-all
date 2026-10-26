import { ROLES } from '../../../constants/roles';
import { assertPlatformStaff } from '../../../lib/platformAccess';
import type { GraphQLContext } from '../../../middleware/auth';
import type { PermissionAction } from '../../permissions/permission.model';
import { recordAudit } from '../../audit';
import { isKnownProvider } from './provider-guides';
import {
  providerProfileService as service,
  type ProviderLinkInput,
  type ProviderLoginInput,
} from './provider-profile.service';

type ForProvider = { provider: string };
type Id = ForProvider & { id: string };
type Save<T> = ForProvider & { id?: string | null; input: T };

/** VIEW reads the guide; anything else is TechConfig work and needs the vault open. */
const guard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], action);

const audit = (ctx: GraphQLContext, provider: string, label: string, summary: string) =>
  recordAudit(ctx, {
    action: 'UPDATE',
    module: 'TechConfig',
    entityId: provider,
    entityLabel: label,
    summary,
  });

export const providerProfileResolvers = {
  Query: {
    techProviderProfile: async (_p: unknown, { provider }: ForProvider, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return isKnownProvider(provider) ? service.view(provider) : null;
    },
    techProviderLoginPassword: async (_p: unknown, { provider, id }: Id, ctx: GraphQLContext) => {
      await guard(ctx, 'EDIT');
      const { label, value } = await service.revealPassword(provider, id);
      await recordAudit(ctx, {
        action: 'ACCESS',
        module: 'TechConfig',
        entityId: provider,
        entityLabel: label,
        summary: `Revealed the ${provider} account password for ${label}`,
      });
      return value;
    },
  },
  Mutation: {
    saveTechProviderLogin: async (
      _p: unknown,
      { provider, id, input }: Save<ProviderLoginInput>,
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const { label, view } = await service.saveLogin(provider, id ?? null, input);
      await audit(ctx, provider, label, `Saved the ${provider} account ${label}`);
      return view;
    },
    deleteTechProviderLogin: async (_p: unknown, { provider, id }: Id, ctx: GraphQLContext) => {
      await guard(ctx, 'DELETE');
      const { label, view } = await service.deleteLogin(provider, id);
      await audit(ctx, provider, label, `Removed the ${provider} account ${label}`);
      return view;
    },
    saveTechProviderLink: async (
      _p: unknown,
      { provider, id, input }: Save<ProviderLinkInput>,
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      const { label, view } = await service.saveLink(provider, id ?? null, input);
      await audit(ctx, provider, label, `Saved the ${provider} link ${label}`);
      return view;
    },
    deleteTechProviderLink: async (_p: unknown, { provider, id }: Id, ctx: GraphQLContext) => {
      await guard(ctx, 'DELETE');
      const { label, view } = await service.deleteLink(provider, id);
      await audit(ctx, provider, label, `Removed the ${provider} link ${label}`);
      return view;
    },
  },
};
