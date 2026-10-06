import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ThreadItem } from "../../state/state";
import { strings } from "../../strings";
import { chatRadius } from "../../theme";
import { BrandAvatar } from "../BrandAvatar";
import { Attachments } from "./Attachments";
import { Rating, Sources, Suggestions } from "./BotExtras";
import { MessageMeta } from "./MessageMeta";
import { visuallyHidden } from "../sx";

interface MessageRowProps {
  item: ThreadItem;
  /** First and last of a run of messages from the same sender. */
  first: boolean;
  last: boolean;
  seen: boolean;
  /** Suggestions are only offered under the newest message. */
  newest: boolean;
  onAsk: (text: string) => void;
  onRate: (messageId: string, helpful: boolean) => void;
  onRetry: (key: string) => void;
  onDiscard: (key: string) => void;
}

const AVATAR = 28;

function SenderAvatar({ item }: Readonly<{ item: ThreadItem }>) {
  if (item.message.sender === "BOT") {
    return <BrandAvatar size={AVATAR} />;
  }
  return (
    <Avatar
      aria-hidden
      sx={{
        width: AVATAR,
        height: AVATAR,
        fontSize: "0.75rem",
        fontWeight: 700,
        bgcolor: "chat.agent",
        color: "chat.onAgent",
      }}
    >
      {item.message.senderName.charAt(0).toUpperCase()}
    </Avatar>
  );
}

/** Corner radii that make a run of bubbles read as one group, with a tail on the last. */
function bubbleRadius(mine: boolean, first: boolean, last: boolean): string {
  const r = chatRadius.bubble;
  const t = chatRadius.tail;
  const top = first ? r : t;
  const bottom = last ? t : r;
  return mine ? `${r} ${top} ${bottom} ${r}` : `${top} ${r} ${r} ${bottom}`;
}

/** One message: a centred notice (SYSTEM), or a bubble left (team, bot) or right (visitor). */
export function MessageRow(props: Readonly<MessageRowProps>) {
  const { item, first, last, seen, newest, onAsk, onRate, onRetry, onDiscard } = props;
  const { message } = item;

  if (message.sender === "SYSTEM") {
    return (
      <Typography
        component="p"
        variant="caption"
        sx={{
          width: "fit-content",
          maxWidth: "88%",
          mx: "auto",
          my: 1.5,
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          textAlign: "center",
          color: "text.secondary",
          bgcolor: "chat.track",
        }}
      >
        {message.body}
      </Typography>
    );
  }

  const mine = message.sender === "VISITOR";
  const bot = message.sender === "BOT";
  const who = mine ? strings.you : message.senderName;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: mine ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 1,
        mt: first ? 2 : 0.5,
      }}
    >
      {!mine && (
        <Box sx={{ width: AVATAR, flexShrink: 0 }}>{last && <SenderAvatar item={item} />}</Box>
      )}
      <Box
        sx={{
          maxWidth: "80%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: mine ? "flex-end" : "flex-start",
        }}
      >
        {!mine && first && (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: 600, ml: 0.5, mb: 0.25 }}
          >
            {message.senderName}
          </Typography>
        )}
        <Box
          sx={{
            ...bubbleSx(mine, message.body !== ""),
            borderRadius: bubbleRadius(mine, first, last),
            opacity: item.status === "sending" ? 0.75 : 1,
            outline: item.status === "failed" ? 2 : 0,
            outlineColor: "error.main",
          }}
        >
          <Box component="span" sx={visuallyHidden}>{`${who}: `}</Box>
          {message.body && (
            <Typography
              variant="body2"
              sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.55 }}
            >
              {message.body}
            </Typography>
          )}
          <Attachments files={message.attachments} />
          {bot && <Sources sources={message.sources} />}
        </Box>
        {bot && newest && <Suggestions suggestions={message.suggestions} onAsk={onAsk} />}
        {bot && <Rating message={message} onRate={(helpful) => onRate(message.id, helpful)} />}
        <MessageMeta item={item} show={last} seen={seen} onRetry={onRetry} onDiscard={onDiscard} />
      </Box>
    </Box>
  );
}

/** Text sits in a filled bubble; a picture on its own is framed by a hairline instead. */
function bubbleSx(mine: boolean, hasText: boolean) {
  if (!hasText) {
    return mediaOnlySx;
  }
  return mine ? mineSx : theirsSx;
}

const mediaOnlySx = {
  p: 0,
  overflow: "hidden",
  border: 1,
  borderColor: "chat.edge",
  bgcolor: "chat.bubble",
  "& img, & video": { borderRadius: 0 },
  "& > .MuiBox-root": { mt: 0 },
} as const;

const mineSx = {
  px: 1.5,
  py: 1,
  color: "chat.onAccent",
  backgroundImage: "var(--mui-palette-chat-accent)",
  boxShadow: 1,
} as const;

const theirsSx = {
  px: 1.5,
  py: 1,
  color: "chat.onBubble",
  bgcolor: "chat.bubble",
  border: 1,
  borderColor: "chat.edge",
} as const;
