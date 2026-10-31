import { z } from 'zod';
import { McpEndpoint } from '@exyconn/shell/graphql/generated';
import type { McpSettingsFormValues } from './mcp-settings.types';

/** The largest hourly limit the server accepts; 0 is no limit. */
export const MAX_CALLS_PER_HOUR = 100_000;

const limit = (what: string) =>
  z.coerce
    .number({ message: `${what} must be a number` })
    .int(`${what} must be a whole number`)
    .min(0, `${what} cannot be negative; 0 means no limit`)
    .max(MAX_CALLS_PER_HOUR, `${what} can be at most ${MAX_CALLS_PER_HOUR}`);

/** The MCP settings, as the server checks them too. */
export const mcpSettingsSchema = z.object({
  callsPerHourPerPerson: limit('Calls an hour per person'),
  callsPerHourPerConnection: limit('Calls an hour per connection'),
  writesPerHourPerPerson: limit('Changes an hour per person'),
  readOnlyServers: z.array(z.enum(McpEndpoint)),
  alertsEnabled: z.boolean(),
  alertErrorRatePercent: z.coerce
    .number({ message: 'Error rate must be a number' })
    .int('Error rate must be a whole number')
    .min(1, 'Error rate must be at least 1%')
    .max(100, 'Error rate can be at most 100%'),
  alertP95Ms: z.coerce
    .number({ message: 'Time must be a number' })
    .int('Time must be a whole number of milliseconds')
    .min(100, 'Time must be at least 100 ms')
    .max(600_000, 'Time can be at most 600000 ms'),
  alertMinCalls: z.coerce
    .number({ message: 'Calls must be a number' })
    .int('Calls must be a whole number')
    .min(1, 'At least 1 call')
    .max(MAX_CALLS_PER_HOUR, `At most ${MAX_CALLS_PER_HOUR} calls`),
  alertSlackChannel: z.string(),
  dailyDigest: z.boolean(),
});

export type McpSettingsValues = z.infer<typeof mcpSettingsSchema>;

/** The form's starting values from what the company has saved. */
export function initialValues(saved: McpSettingsFormValues): McpSettingsValues {
  return {
    callsPerHourPerPerson: saved.callsPerHourPerPerson,
    callsPerHourPerConnection: saved.callsPerHourPerConnection,
    writesPerHourPerPerson: saved.writesPerHourPerPerson,
    readOnlyServers: saved.readOnlyServers,
    alertsEnabled: saved.alertsEnabled,
    alertErrorRatePercent: saved.alertErrorRatePercent,
    alertP95Ms: saved.alertP95Ms,
    alertMinCalls: saved.alertMinCalls,
    alertSlackChannel: saved.alertSlackChannel,
    dailyDigest: saved.dailyDigest,
  };
}
