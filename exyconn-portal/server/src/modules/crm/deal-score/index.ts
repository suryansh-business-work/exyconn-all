import { assertRole } from '../../../middleware/roleGuard';
import { ROLES } from '../../../constants/roles';
import { forEachOrganization } from '../../organizations';
import { registerBackgroundJob } from '../../tech/jobs.registry';
import { JOB_KEYS, recordJobRun } from '../../../utils/jobHeartbeat';
import { logger } from '../../../utils/logger';
import type { GraphQLContext } from '../../../middleware/auth';
import { scoreDeal, scoreOpenDeals } from './deal-score.service';

export { dealScoreTypeDefs } from './deal-score.typeDefs';
export { scoreDealsOfContacts } from './deal-score.service';

/** Activity and email age every day, so open deals are rescored on a timer as well as on save. */
const RESCORE_MS = 6 * 60 * 60_000;

export const dealScoreResolvers = {
  /** Written before scoring existed, a `.lean()` deal comes back without these. */
  Deal: {
    score: (deal: { score?: number | null }) => deal.score ?? null,
    scoreReasons: (deal: { scoreReasons?: unknown[] | null }) => deal.scoreReasons ?? [],
    scoredAt: (deal: { scoredAt?: Date | null }) => deal.scoredAt ?? null,
  },
  Mutation: {
    scoreDeal: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, [ROLES.CRM]);
      return scoreDeal(id);
    },
    scoreOpenDeals: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, [ROLES.CRM]);
      return scoreOpenDeals();
    },
  },
};

/** Rescores every company's open deals now and every six hours after. Nothing escapes a tick. */
export function startDealScoring(): void {
  const tick = () => {
    let scored = 0;
    forEachOrganization(async () => {
      scored += await scoreOpenDeals();
    }, 'CRM deal scores')
      .then(() => recordJobRun(JOB_KEYS.crmDealScores, `Scored ${scored} open deal(s)`))
      .catch((error: unknown) => logger.error(error, 'CRM deal scoring failed'));
  };
  tick();
  globalThis.setInterval(tick, RESCORE_MS).unref();
}

registerBackgroundJob({
  key: JOB_KEYS.crmDealScores,
  label: 'CRM deal scores',
  description:
    'Recomputes the 0-100 score of every open deal from its activities, stage age and email engagement.',
  runOnce: () => scoreOpenDeals(),
});
