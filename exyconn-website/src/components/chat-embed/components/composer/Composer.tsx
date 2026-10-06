import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type SyntheticEvent,
  type KeyboardEvent,
} from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useAttachments } from "../../hooks/useAttachments";
import { useRecorder } from "../../hooks/useRecorder";
import type { ChatActions } from "../../state/controller";
import { strings } from "../../strings";
import type { Channel } from "../../types";
import { accentButton, visuallyHidden } from "../sx";
import { AttachmentPreviews } from "./AttachmentPreviews";
import { VoiceBar } from "./VoiceBar";

/** The server's CHAT_LIMITS.body; the counter shows in the last 200 characters. */
const MAX_BODY = 2000;
const COUNTER_FROM = MAX_BODY - 200;

interface ComposerProps {
  channel: Channel;
  actions: ChatActions;
  /** Pictures, clips and voice notes: the live thread only, when the settings allow uploads. */
  allowUploads: boolean;
  maxUploadMb: number;
}

/**
 * One thread's message box. Every section owns its own Composer (its own draft, files and
 * handlers), and a send always names this composer's channel.
 */
export function Composer({ channel, actions, allowUploads, maxUploadMb }: Readonly<ComposerProps>) {
  const id = useId();
  const [body, setBody] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const live = channel === "LIVE";
  const attachments = useAttachments(maxUploadMb, actions.showError);
  const recorder = useRecorder({
    onDone: (file) => actions.send(channel, "", [file]),
    onError: actions.showError,
  });
  const section = live ? strings.tabLive : strings.tabKnowledge;
  const canSend = body.trim() !== "" || attachments.files.length > 0;

  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault();
    if (!canSend) {
      return;
    }
    const files = attachments.files.map(({ name, data }) => ({ name, data }));
    actions.send(channel, body.trim(), files);
    setBody("");
    attachments.clear();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBody(event.target.value.slice(0, MAX_BODY));
    if (live) {
      actions.typed();
    }
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    attachments.add(picked).catch((error: unknown) => console.warn("[chat] attach failed", error));
  };

  if (recorder.active) {
    return (
      <Box sx={composerSx}>
        <VoiceBar seconds={recorder.seconds} onCancel={recorder.cancel} onStop={recorder.stop} />
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={composerSx}
      aria-label={strings.messageLabel(section)}
    >
      <AttachmentPreviews files={attachments.files} onRemove={attachments.remove} />
      <Box sx={rowSx}>
        {allowUploads && (
          <>
            <input
              ref={fileInput}
              id={`${id}-files`}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={onPick}
            />
            <IconButton
              aria-label={strings.attach}
              title={strings.attach}
              onClick={() => fileInput.current?.click()}
            >
              <AttachFileRoundedIcon />
            </IconButton>
          </>
        )}
        <TextField
          value={body}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onBlur={live ? actions.stopTyping : undefined}
          placeholder={live ? strings.placeholderLive : strings.placeholderKnowledge}
          multiline
          maxRows={5}
          fullWidth
          size="small"
          slotProps={{
            htmlInput: { "aria-label": strings.messageLabel(section), maxLength: MAX_BODY },
          }}
          sx={fieldSx}
        />
        {allowUploads && !canSend && (
          <IconButton aria-label={strings.record} title={strings.record} onClick={recorder.start}>
            <MicRoundedIcon />
          </IconButton>
        )}
        {(canSend || !allowUploads) && (
          <IconButton
            type="submit"
            aria-label={strings.send}
            title={strings.send}
            disabled={!canSend}
            sx={accentButton}
          >
            <SendRoundedIcon />
          </IconButton>
        )}
      </Box>
      <Counter length={body.length} />
    </Box>
  );
}

/** "123 characters left", near the limit only; read out politely as it changes. */
function Counter({ length }: Readonly<{ length: number }>) {
  const near = length >= COUNTER_FROM;
  return (
    <Typography
      variant="caption"
      aria-live="polite"
      sx={
        near
          ? { display: "block", textAlign: "right", color: "text.secondary", mt: 0.5 }
          : visuallyHidden
      }
    >
      {near ? strings.charsLeft(MAX_BODY - length) : ""}
    </Typography>
  );
}

const rowSx = {
  display: "flex",
  alignItems: "flex-end",
  gap: 0.75,
  "& > .MuiIconButton-root:not([type=submit])": { color: "text.secondary", mb: 0.25 },
} as const;

const fieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "20px", bgcolor: "background.default", py: 1.1 },
} as const;

const composerSx = {
  px: 1.5,
  pt: 1.25,
  pb: "max(12px, env(safe-area-inset-bottom))",
  borderTop: 1,
  borderColor: "divider",
  bgcolor: "background.paper",
} as const;
