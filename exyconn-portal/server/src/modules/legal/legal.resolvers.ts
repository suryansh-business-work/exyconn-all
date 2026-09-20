import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import {
  contractSignatures,
  contractToSign,
  requestContractSignature,
  revokeContractSignature,
  signContractInternally,
  signContractWithToken,
} from './signature.service';
import type { GraphQLContext } from '../../middleware/auth';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.LEGAL]);

/**
 * Signatures on contracts.
 *
 * Signing used to be one mutation that wrote a name into a field: whoever was looking at the
 * Sign Board typed the counterparty's name and the contract read as signed. That records an
 * assertion. What is here instead is two paths that both produce evidence — a link the
 * counterparty signs behind, and our own side signed by an account the request can name.
 */
export const legalCustomResolvers = {
  Query: {
    contractSignatures: (
      _p: unknown,
      { contractId }: { contractId: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return contractSignatures(contractId);
    },
    /** Unauthenticated: the counterparty has a link, not an account. */
    contractToSign: (_p: unknown, { token }: { token: string }) => contractToSign(token),
  },
  Mutation: {
    requestContractSignature: (
      _p: unknown,
      args: {
        contractId: string;
        signerName: string;
        signerEmail: string;
        message?: string | null;
      },
      ctx: GraphQLContext,
    ) => {
      const user = guard(ctx);
      return requestContractSignature({ ...args, requestedByName: user.email });
    },
    revokeContractSignature: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return revokeContractSignature(id);
    },
    /**
     * Our own side, signed by the account making the request.
     *
     * The signer is read from the token rather than typed, so the record names whoever
     * actually did it — the old mutation took the name as an argument, which meant the
     * signature said whatever the person at the keyboard wanted it to say.
     */
    signContract: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const user = guard(ctx);
      return signContractInternally({
        contractId: id,
        signerEmail: user.email,
        ip: ctx.ip ?? 'unknown',
        userAgent: ctx.userAgent ?? '',
      });
    },
    /**
     * Unauthenticated, and the caller's address and agent are read from the request rather
     * than from arguments: they are evidence, and evidence a signer can type is not evidence.
     */
    signContractWithToken: (
      _p: unknown,
      { token, signedName }: { token: string; signedName: string },
      ctx: GraphQLContext,
    ) =>
      signContractWithToken({
        token,
        signedName,
        ip: ctx.ip ?? 'unknown',
        userAgent: ctx.userAgent ?? '',
      }),
  },
};
