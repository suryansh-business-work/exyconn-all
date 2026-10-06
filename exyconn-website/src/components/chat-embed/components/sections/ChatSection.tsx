import type { ChatActions } from "../../state/controller";
import type { ChatState, Tab } from "../../state/state";
import type { Channel } from "../../types";
import { Composer } from "../composer/Composer";
import { SignInFlow } from "./SignInFlow";
import { EndedState } from "../thread/EndedState";
import { Thread } from "../thread/Thread";

interface ChatSectionProps {
  channel: Channel;
  state: ChatState;
  actions: ChatActions;
  /** Whether this section's tab is the one showing. */
  active: boolean;
  onTab: (tab: Tab) => void;
}

/**
 * "Chat with us" or "Knowledge Bot": sign-in until the visitor has a session, then that
 * thread and its own composer. Each section is its own instance with its own draft, so what
 * is typed or sent in one can never reach the other.
 */
export function ChatSection({
  channel,
  state,
  actions,
  active,
  onTab,
}: Readonly<ChatSectionProps>) {
  if (state.step !== "signedIn" || !state.session) {
    return <SignInFlow state={state} actions={actions} channel={channel} />;
  }
  const ended = state.session.status === "CLOSED";
  const config = state.config;

  return (
    <>
      <Thread
        channel={channel}
        items={state.threads[channel]}
        typing={state.typing[channel]}
        config={config}
        session={state.session}
        visible={active && state.open}
        actions={actions}
        onTab={onTab}
      />
      {ended ? (
        <EndedState onNewChat={actions.newChat} onDownload={actions.download} />
      ) : (
        <Composer
          channel={channel}
          actions={actions}
          allowUploads={channel === "LIVE" && Boolean(config?.allowUploads)}
          maxUploadMb={config?.maxUploadMb ?? 0}
        />
      )}
    </>
  );
}
