import { EmailFragmentModel } from './email-fragment.model';
import { EmailTemplateModel } from './email-template.model';
import { EmailLogModel } from './email-log.model';
import { EmailConfigModel } from '../tech/email-config.model';
import { emailer } from './email.service';
import { fragmentsIn, variablesIn } from './email.render';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withIds } from '../../utils/serialize';
import { badRequest } from '../../utils/errors';
import { tableQuery, type TableConfig, type TableQueryInput } from '../../utils/tableQuery';
import type { GraphQLContext } from '../../middleware/auth';

const techRoles = [ROLES.TECH];

interface FragmentInput {
  key: string;
  name: string;
  description?: string;
  mjml: string;
}

interface TemplateInput extends FragmentInput {
  subject: string;
  isActive?: boolean;
}

/** `[{name, value}]` from GraphQL is a map everywhere else. */
type VariableInput = { name: string; value: string };
function toVariables(list?: VariableInput[] | null): Record<string, string> {
  return Object.fromEntries((list ?? []).map((entry) => [entry.name, entry.value]));
}

export const emailFragmentsService = createCrudService<FragmentInput>(
  EmailFragmentModel as never,
  'EmailFragment',
);
export const emailTemplatesService = createCrudService<TemplateInput>(
  EmailTemplateModel as never,
  'EmailTemplate',
);

const fragments = createCrudResolvers(emailFragmentsService, {
  name: 'EmailFragment',
  roles: techRoles,
  table: {
    searchFields: ['key', 'name', 'description'],
    filterFields: ['key', 'name'],
    sortFields: ['key', 'name', 'updatedAt'],
    defaultSort: { field: 'key', dir: 'ASC' },
  },
  stats: {},
});

const templates = createCrudResolvers(emailTemplatesService, {
  name: 'EmailTemplate',
  roles: techRoles,
  table: {
    searchFields: ['key', 'name', 'subject', 'description'],
    filterFields: ['key', 'name', 'isActive'],
    sortFields: ['key', 'name', 'isActive', 'updatedAt'],
    defaultSort: { field: 'key', dir: 'ASC' },
  },
  stats: { countBy: ['isActive'] },
});

/** Logs are written by the send path, so they are read-only here. */
const LOG_TABLE: TableConfig = {
  searchFields: ['templateKey', 'templateName', 'to', 'subject', 'error'],
  filterFields: ['templateKey', 'to', 'status'],
  sortFields: ['templateKey', 'to', 'status', 'sentAt'],
  defaultSort: { field: 'sentAt', dir: 'DESC' },
};

/** How many days of trend the dashboard shows when the caller does not say. */
const DEFAULT_TREND_DAYS = 14;

/** `2026-09-04` in UTC — the key a day bucket is counted under. */
function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Every day in the window, oldest first, so a quiet day is a gap at zero not a missing bar. */
function daysBack(count: number, now: Date): string[] {
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    keys.push(dayKey(new Date(now.getTime() - offset * 86_400_000)));
  }
  return keys;
}

/**
 * The email system at a glance.
 *
 * `configured` is first among equals: every other number here can look healthy while nothing
 * has left the building, because no SMTP configuration is active. The dashboard says so
 * rather than leaving somebody to work it out from an empty log.
 */
async function emailDashboard(
  _p: unknown,
  { days }: { days?: number | null },
  ctx: GraphQLContext,
) {
  assertRole(ctx, techRoles);
  const window = Math.min(Math.max(days ?? DEFAULT_TREND_DAYS, 1), 90);
  const now = new Date();
  const since = new Date(now.getTime() - (window - 1) * 86_400_000);
  since.setUTCHours(0, 0, 0, 0);

  const [templateCount, activeCount, fragmentCount, config, recent, logs] = await Promise.all([
    EmailTemplateModel.countDocuments(),
    EmailTemplateModel.countDocuments({ isActive: true }),
    EmailFragmentModel.countDocuments(),
    EmailConfigModel.findOne({ isActive: true }).select('_id').lean(),
    EmailLogModel.find({ status: 'FAILED' }).sort({ sentAt: -1 }).limit(5).lean(),
    EmailLogModel.find({ sentAt: { $gte: since } })
      .select('templateKey templateName status sentAt')
      .lean(),
  ]);

  const perDay = new Map(daysBack(window, now).map((date) => [date, { sent: 0, failed: 0 }]));
  const perTemplate = new Map<
    string,
    { key: string; name: string; sent: number; failed: number }
  >();

  for (const log of logs) {
    const day = perDay.get(dayKey(log.sentAt));
    const template = perTemplate.get(log.templateKey) ?? {
      key: log.templateKey,
      name: log.templateName,
      sent: 0,
      failed: 0,
    };
    if (log.status === 'SENT') {
      if (day) day.sent += 1;
      template.sent += 1;
    } else {
      if (day) day.failed += 1;
      template.failed += 1;
    }
    perTemplate.set(log.templateKey, template);
  }

  const byTemplate = [...perTemplate.values()];
  byTemplate.sort((a, b) => b.sent + b.failed - (a.sent + a.failed));

  return {
    templates: templateCount,
    activeTemplates: activeCount,
    fragments: fragmentCount,
    sent: logs.filter((log) => log.status === 'SENT').length,
    failed: logs.filter((log) => log.status === 'FAILED').length,
    configured: config !== null,
    days: [...perDay.entries()].map(([date, counts]) => ({ date, ...counts })),
    byTemplate,
    recentFailures: withIds(recent as Array<{ _id: unknown }>),
  };
}

export const emailResolvers = {
  /**
   * Both are derived from the markup on every read rather than stored. A template's
   * placeholders change the moment somebody edits its copy, and a stored list would go on
   * describing the version before that edit.
   */
  EmailTemplate: {
    variables: (template: { subject: string; mjml: string }) =>
      variablesIn(`${template.subject} ${template.mjml}`),
    fragments: (template: { mjml: string }) => fragmentsIn(template.mjml),
  },

  Query: {
    ...fragments.Query,
    ...templates.Query,
    listEmailLogsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techRoles);
      const page = await tableQuery(EmailLogModel, input, LOG_TABLE);
      return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
    },
    listEmailLogsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techRoles);
      const buckets = await EmailLogModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      return {
        total: await EmailLogModel.countDocuments(),
        counts: [
          { field: 'status', buckets: buckets.map((b) => ({ value: b._id, count: b.count })) },
        ],
        sums: [],
      };
    },
    emailDashboard,
    previewEmailTemplate: async (
      _p: unknown,
      { key, variables }: { key: string; variables?: VariableInput[] | null },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techRoles);
      try {
        return await emailer.render(key, toVariables(variables));
      } catch (error) {
        // A half-written template is an ordinary editing state, not a server fault.
        badRequest(error instanceof Error ? error.message : 'The template could not be rendered.');
      }
    },
  },

  Mutation: {
    ...fragments.Mutation,
    ...templates.Mutation,
    /**
     * Sends the real thing through the real path, and logs it like any other send. A test
     * that took a shortcut would be a test of the shortcut.
     */
    sendTestEmailTemplate: async (
      _p: unknown,
      { key, to, variables }: { key: string; to: string; variables?: VariableInput[] | null },
      ctx: GraphQLContext,
    ) => {
      const actor = assertRole(ctx, techRoles);
      try {
        await emailer.send({
          template: key,
          to,
          variables: toVariables(variables),
          triggeredBy: ctx.user?.email ?? actor.id,
        });
      } catch (error) {
        badRequest(error instanceof Error ? error.message : 'The test email could not be sent.');
      }
      return true;
    },
  },
};

export { emailTypeDefs } from './email.typeDefs';
