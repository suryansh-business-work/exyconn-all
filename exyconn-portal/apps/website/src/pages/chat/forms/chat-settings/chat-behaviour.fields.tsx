import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { SettingsSection } from './SettingsSection';

/** Switching the widget on, the handoff timing, the bot's model and the upload rules. */
export function ChatBehaviourFields() {
  return (
    <SettingsSection
      title="Behaviour"
      description="How the widget, the handoff and the Knowledge Bot work."
    >
      <RhfSwitch name="enabled" label="Show the chat widget on exyconn.com and the tools site" />
      <RhfTextField
        name="noReplyTimeoutSeconds"
        label="No-reply timeout (seconds)"
        type="number"
        helperText="30–3600. If nobody on the team replies within this time, the Knowledge Bot takes over."
      />
      <RhfTextField
        name="sessionTimeoutMinutes"
        label="Session timeout (minutes)"
        type="number"
        helperText="2–120. A chat closes after this long without a message from either side; the visitor sees a countdown."
      />
      <RhfTextField
        name="botModel"
        label="Bot model"
        helperText="The OpenAI model the Knowledge Bot uses, e.g. gpt-4o."
      />
      <RhfTextField
        name="embeddingModel"
        label="Embedding model"
        helperText="The OpenAI model used to find the knowledge a question is about, e.g. text-embedding-3-small."
      />
      <RhfTextField
        name="maxContextChars"
        label="Knowledge per question (characters)"
        type="number"
        helperText="2000–60000. How much of the knowledge base goes to the bot with each question."
      />
      <RhfSwitch name="allowUploads" label="Let visitors send pictures, videos and voice notes" />
      <RhfTextField
        name="maxUploadMb"
        label="Largest upload (MB)"
        type="number"
        helperText="1–10 MB per file, for visitors and the team."
      />
      <RhfSwitch name="soundEnabledByDefault" label="Sound on by default for visitors" />
      <RhfSwitch
        name="transcriptOnClose"
        label="Email the visitor the conversation when a chat closes"
      />
    </SettingsSection>
  );
}
