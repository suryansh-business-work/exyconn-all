import { ContractModel } from './legal.model';
import { assertRole } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { notFound } from '../../utils/errors';
import { mailer } from '../../utils/mailer';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.LEGAL]);

/** Custom Legal mutations layered on top of the contract/document CRUD. */
export const legalCustomResolvers = {
  Mutation: {
    sendContract: async (
      _p: unknown,
      { id, email, message }: { id: string; email: string; message?: string | null },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const contract = await ContractModel.findById(id);
      if (!contract) notFound('Contract');
      await mailer.sendCustomEmail({
        name: contract.party,
        email,
        subject: `Contract for review: ${contract.title}`,
        message:
          message ?? `Please find the contract "${contract.title}" for your review and signature.`,
      });
      contract.sentAt = new Date();
      await contract.save();
      return withId(contract.toObject() as { _id: unknown });
    },

    signContract: async (
      _p: unknown,
      { id, signedBy }: { id: string; signedBy: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const contract = await ContractModel.findByIdAndUpdate(
        id,
        { signedBy, signedAt: new Date(), status: 'ACTIVE' },
        { new: true },
      ).lean();
      if (!contract) notFound('Contract');
      return withId(contract as { _id: unknown });
    },
  },
};
