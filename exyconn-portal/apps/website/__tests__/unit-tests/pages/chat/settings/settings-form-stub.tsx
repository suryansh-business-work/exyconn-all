import type { ChatSettingsRow } from '../../../../../src/pages/chat/forms/chat-settings';

/** Stands in for ChatSettingsForm (tested on its own): shows which settings it was opened with. */
export function ChatSettingsFormStub({ initial }: Readonly<{ initial: ChatSettingsRow }>) {
  return <form aria-label="Chatbot settings form">{`Editing ${initial.botName}`}</form>;
}
