import type { GraphQLContext } from '../../middleware/auth';
import { assertMaUser, scopeFilter, seesCompany, type MaScope } from './ma.access';
import { botDispatches, cancelBot, sendBot } from './bot.service';

/** A dispatch row as the schema shows it: its id as a string. */
const shown = <T extends { _id: unknown }>(row: T) => ({ ...row, id: String(row._id) });

export const maBotQueries = {
  maBotDispatches: async (_p: unknown, args: { scope?: MaScope }, ctx: GraphQLContext) => {
    const actor = await assertMaUser(ctx);
    const rows = await botDispatches(await scopeFilter(ctx, actor, args.scope));
    return rows.map(shown);
  },
};

export const maBotMutations = {
  maSendBot: async (
    _p: unknown,
    args: { meetUrl: string; title?: string | null },
    ctx: GraphQLContext,
  ) => shown(await sendBot(ctx, await assertMaUser(ctx), args)),
  maCancelBot: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) => {
    const actor = await assertMaUser(ctx);
    return shown(await cancelBot(ctx, actor, args.id, await seesCompany(ctx)));
  },
};
