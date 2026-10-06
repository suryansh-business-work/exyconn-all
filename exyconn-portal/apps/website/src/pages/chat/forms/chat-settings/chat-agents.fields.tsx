import type { HTMLAttributes } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Autocomplete, Box, Chip, Flex, Text, TextField } from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useWebsiteChatAgentCandidatesQuery,
  type WebsiteChatAgentCandidatesQuery,
} from '@exyconn/shell/graphql/generated';
import type { ChatSettingsFormInput } from './chat-settings.types';
import { SettingsSection } from './SettingsSection';

type Agent = WebsiteChatAgentCandidatesQuery['websiteChatAgentCandidates'][number];

const AGENTS_HINT =
  'Each new chat goes to the freest agent: online first, then the fewest open chats. Leave empty to keep chats unassigned for anyone to claim.';

/** Green when the agent is signed in to the console right now. */
function OnlineDot({ online }: Readonly<{ online: boolean }>) {
  const t = useT();
  return (
    <Box
      component="span"
      role="img"
      aria-label={online ? t('Online') : t('Offline')}
      sx={{
        width: 8,
        height: 8,
        flexShrink: 0,
        borderRadius: '50%',
        bgcolor: online ? 'success.main' : 'text.secondary',
      }}
    />
  );
}

/** One agent in the picker: name, email, whether they are online and how busy they are. */
function AgentOption({
  agent,
  optionProps,
}: Readonly<{ agent: Agent; optionProps: HTMLAttributes<HTMLLIElement> }>) {
  const t = useT();
  return (
    <Box component="li" {...optionProps}>
      <Flex direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, width: '100%' }}>
        <OnlineDot online={agent.online} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Text size="sm" noWrap>
            {agent.name}
          </Text>
          <Text size="caption" color="text.secondary" noWrap component="div">
            {agent.email}
          </Text>
        </Box>
        <Text size="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {t('{count} open chats', { count: agent.openChats })}
        </Text>
      </Flex>
    </Box>
  );
}

/** Who answers new chats: the people new chats are assigned to, freest first. */
export function ChatAgentsFields() {
  const t = useT();
  const { control } = useFormContext<ChatSettingsFormInput>();
  const { data, loading, error } = useWebsiteChatAgentCandidatesQuery({
    fetchPolicy: 'cache-and-network',
  });
  const agents = data?.websiteChatAgentCandidates ?? [];
  const loadError = error ? errorMessage(error, t('The agents could not be loaded.')) : undefined;

  return (
    <SettingsSection
      title="Chat agents"
      description="The people on the team who answer live chats from the widget."
    >
      <Controller
        name="agentIds"
        control={control}
        render={({ field, fieldState }) => {
          const chosen = new Set(field.value);
          return (
            <Autocomplete
              multiple
              options={agents}
              loading={loading}
              value={agents.filter((agent) => chosen.has(agent.id))}
              getOptionLabel={(agent) => agent.name}
              isOptionEqualToValue={(option, current) => option.id === current.id}
              onChange={(_event, next) => field.onChange(next.map((agent) => agent.id))}
              onBlur={field.onBlur}
              renderOption={({ key, ...optionProps }, agent) => (
                <AgentOption key={key} agent={agent} optionProps={optionProps} />
              )}
              renderValue={(items, getItemProps) =>
                items.map((agent, index) => {
                  const { key, ...itemProps } = getItemProps({ index });
                  return <Chip key={key} label={agent.name} size="small" {...itemProps} />;
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  name={field.name}
                  label={t('Chat agents')}
                  error={Boolean(fieldState.error ?? loadError)}
                  helperText={fieldState.error?.message ?? loadError ?? t(AGENTS_HINT)}
                />
              )}
            />
          );
        }}
      />
    </SettingsSection>
  );
}
