import type { GraphQLContext } from '../../middleware/auth';
import { assertMaUser, scopeFilter, type MaScope } from './ma.access';
import { meetingCalendar } from './calendar.service';

interface CalendarArgs {
  from: Date | string;
  to: Date | string;
  scope?: MaScope;
}

export const maCalendarQueries = {
  maCalendar: async (_p: unknown, args: CalendarArgs, ctx: GraphQLContext) => {
    const actor = await assertMaUser(ctx);
    const scope = await scopeFilter(ctx, actor, args.scope);
    return meetingCalendar(actor, ctx.organizationId ?? '', scope, {
      from: new Date(args.from),
      to: new Date(args.to),
    });
  },
};
