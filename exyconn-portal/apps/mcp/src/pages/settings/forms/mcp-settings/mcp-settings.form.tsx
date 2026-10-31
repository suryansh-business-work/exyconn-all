import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { FormSection } from '@exyconn/shell/components/form/FormSection';
import {
  RhfMultiSelect,
  RhfSelect,
  RhfSwitch,
  RhfTextField,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useUpdateMcpSettingsMutation } from '@exyconn/shell/graphql/generated';
import { initialValues, mcpSettingsSchema, type McpSettingsValues } from './mcp-settings.schema';
import type { McpSettingsFormValues } from './mcp-settings.types';

interface McpSettingsFormProps {
  saved: McpSettingsFormValues;
  /** Module servers that can be made read-only. */
  servers: SelectOption[];
  /** Slack channels alerts can go to; empty when Slack is not set up. */
  channels: SelectOption[];
  onCancel: () => void;
}

/** A whole-number field: 0 means no limit for the rate limits. */
const NUMBER_PROPS = { type: 'number', slotProps: { htmlInput: { min: 0, step: 1 } } } as const;

/**
 * React Hook Form + Zod form for the company's MCP settings: hourly rate limits per person,
 * per connection and for changes; servers whose tools only read; and when admins are alerted
 * (error rate, p95 time, a minimum of calls) and where (notifications, a Slack channel, a daily
 * digest). Tools are switched off one by one on each server's Tools tab.
 */
export function McpSettingsForm({
  saved,
  servers,
  channels,
  onCancel,
}: Readonly<McpSettingsFormProps>) {
  const notify = useNotify();
  const [save] = useUpdateMcpSettingsMutation();
  const methods = useForm<z.input<typeof mcpSettingsSchema>, unknown, McpSettingsValues>({
    mode: 'onTouched',
    resolver: zodResolver(mcpSettingsSchema),
    values: initialValues(saved),
  });

  const onSubmit = async (input: McpSettingsValues) => {
    try {
      await save({ variables: { input } });
      notify('MCP settings saved');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save the MCP settings', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Save settings"
    >
      <FormSection
        title="Rate limits"
        hint="Calls Claude may make in any hour. 0 means no limit. A call over a limit is refused and logged as RATE_LIMITED."
      >
        <RhfTextField
          name="callsPerHourPerPerson"
          label="Calls an hour per person"
          helperText="Across every connection the person has."
          {...NUMBER_PROPS}
        />
        <RhfTextField
          name="callsPerHourPerConnection"
          label="Calls an hour per connection"
          helperText="One Claude client for one person."
          {...NUMBER_PROPS}
        />
        <RhfTextField
          name="writesPerHourPerPerson"
          label="Changes an hour per person"
          helperText="Creates, updates, deletes and sends."
          {...NUMBER_PROPS}
        />
      </FormSection>
      <FormSection
        title="Read-only servers"
        hint="Claude can read through these servers but is never offered a change. A connection can also be made read-only when it is allowed."
      >
        <RhfMultiSelect
          name="readOnlyServers"
          label="Servers that only read"
          options={servers}
          helperText="Optional. Applies to every connection, including All."
        />
      </FormSection>
      <FormSection
        title="Alerts"
        hint="Checked every five minutes over the last hour. Admins get a notification; at most one alert an hour."
      >
        <RhfSwitch name="alertsEnabled" label="Alert when Claude's calls fail or slow down" />
        <RhfSwitch name="dailyDigest" label="Send a daily summary of yesterday's calls" />
        <RhfTextField
          name="alertErrorRatePercent"
          label="Alert at this error rate (%)"
          type="number"
          slotProps={{ htmlInput: { min: 1, max: 100, step: 1 } }}
        />
        <RhfTextField
          name="alertP95Ms"
          label="Alert when the slowest 5% take over (ms)"
          type="number"
          slotProps={{ htmlInput: { min: 100, step: 100 } }}
        />
        <RhfTextField
          name="alertMinCalls"
          label="Only alert from this many calls an hour"
          helperText="So one failed call is not a 100% error rate."
          type="number"
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
        <RhfSelect
          name="alertSlackChannel"
          label="Slack channel"
          options={[{ value: '', label: 'No Slack channel' }, ...channels]}
          helperText="Optional. Alerts and the digest are also posted here."
        />
      </FormSection>
    </EntityForm>
  );
}
