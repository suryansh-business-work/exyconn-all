import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ChatCodeForm } from "../../forms/chat-code";
import { ChatSignInForm } from "../../forms/chat-sign-in";
import type { ChatActions } from "../../state/controller";
import type { ChatState } from "../../state/state";
import { strings } from "../../strings";
import { chatRadius } from "../../theme";
import type { Channel } from "../../types";
import { BrandAvatar } from "../BrandAvatar";

interface SignInFlowProps {
  state: ChatState;
  actions: ChatActions;
  channel: Channel;
}

/** The welcome as a first message from the team, above the sign-in card. */
function WelcomeBubble({ text, note }: Readonly<{ text: string; note: string }>) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, mb: 2 }}>
      <BrandAvatar size={28} />
      <Box
        sx={{
          px: 1.5,
          py: 1,
          maxWidth: "85%",
          bgcolor: "chat.bubble",
          border: 1,
          borderColor: "chat.edge",
          borderRadius: `${chatRadius.bubble} ${chatRadius.bubble} ${chatRadius.bubble} ${chatRadius.tail}`,
        }}
      >
        {text && (
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, lineHeight: 1.55, mb: note ? 0.5 : 0 }}
          >
            {text}
          </Typography>
        )}
        {note && (
          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.5 }}>
            {note}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/** The welcome, then the details form or the code form, for either chat section. */
export function SignInFlow({ state, actions, channel }: Readonly<SignInFlowProps>) {
  const { config } = state;
  const welcome = (channel === "LIVE" ? config?.welcomeMessage : strings.knowledgeIntro) ?? "";
  const note = channel === "LIVE" && config?.online === false ? config.offlineMessage : "";

  return (
    <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 2.5 }}>
      {state.step !== "code" && (welcome || note) && <WelcomeBubble text={welcome} note={note} />}
      <Box sx={cardSx}>
        {state.step === "code" ? (
          <ChatCodeForm
            email={state.identity.email}
            codeSentAt={state.codeSentAt}
            busy={state.busy}
            onVerify={actions.verifyCode}
            onResend={actions.resendCode}
            onChangeEmail={actions.changeEmail}
          />
        ) : (
          <ChatSignInForm
            defaultValues={state.identity}
            busy={state.busy}
            onSubmit={actions.requestCode}
          />
        )}
      </Box>
    </Box>
  );
}

const cardSx = {
  p: 2.25,
  bgcolor: "background.paper",
  border: 1,
  borderColor: "chat.edge",
  borderRadius: chatRadius.bubble,
  boxShadow: 1,
} as const;
