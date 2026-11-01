import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { SettingsSection } from './SettingsSection';

/** What the bot is called and the fixed messages the widget shows. */
export function ChatMessagesFields() {
  return (
    <SettingsSection
      title="Messages"
      description="The words visitors see from the chat itself, before and between people and the bot."
    >
      <RhfTextField
        name="botName"
        label="Bot name"
        helperText="Shown on the Knowledge Bot's replies. 2–60 characters."
      />
      <RhfTextField
        name="welcomeMessage"
        label="Welcome message"
        multiline
        minRows={2}
        helperText="The first message of every new chat. 5–500 characters."
      />
      <RhfTextField
        name="offlineMessage"
        label="Offline message"
        multiline
        minRows={2}
        helperText="Shown outside the opening hours below, when the Knowledge Bot answers instead."
      />
      <RhfTextField
        name="handoffMessage"
        label="Handoff message"
        multiline
        minRows={2}
        helperText="Shown when nobody replied in time and the Knowledge Bot takes over the question."
      />
      <RhfTextField
        name="refusalMessage"
        label="Refusal message"
        multiline
        minRows={2}
        helperText="What the bot says when a question is outside what it knows about Exyconn."
      />
      <RhfTextField
        name="customInstructions"
        label="Custom instructions"
        multiline
        minRows={3}
        helperText="The bot's persona and tone, e.g. 'friendly, short answers'. These never widen what it may talk about: it still only answers from the knowledge base. Up to 2000 characters."
      />
    </SettingsSection>
  );
}
