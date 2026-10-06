import { forwardRef, useEffect, useState } from "react";
import Badge from "@mui/material/Badge";
import Fab from "@mui/material/Fab";
import { keyframes } from "@mui/material/styles";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import { strings } from "../strings";

const nudge = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-6px) scale(1.06); }
  60% { transform: translateY(0) scale(0.98); }
`;

/** The first appearance: a soft rise and fade, once, after the page has settled. */
const enter = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const NUDGE_MS = 900;
const SIZE = 60;

interface LauncherProps {
  unread: number;
  /** Bumped on every reply that arrives unseen; each bump plays the nudge once. */
  nudges: number;
  reducedMotion: boolean;
  onOpen: () => void;
}

/** The round button in the corner that opens the chat, with the unread count on it. */
export const Launcher = forwardRef<HTMLButtonElement, Readonly<LauncherProps>>(function Launcher(
  { unread, nudges, reducedMotion, onOpen },
  ref
) {
  const [nudging, setNudging] = useState(false);

  useEffect(() => {
    if (nudges === 0 || reducedMotion) {
      return undefined;
    }
    setNudging(true);
    const timer = setTimeout(() => setNudging(false), NUDGE_MS);
    return () => clearTimeout(timer);
  }, [nudges, reducedMotion]);

  const label = unread > 0 ? `${strings.openChat}, ${strings.unread(unread)}` : strings.openChat;

  return (
    // A native tooltip: an MUI one would be clipped by the small closed iframe.
    <Fab
      ref={ref}
      color="primary"
      aria-label={label}
      title={strings.openChat}
      onClick={onOpen}
      sx={{
        position: "absolute",
        right: 18,
        bottom: 18,
        width: SIZE,
        height: SIZE,
        borderRadius: `${SIZE * 0.34}px`,
        color: "chat.onAccent",
        backgroundImage: "var(--mui-palette-chat-accent)",
        boxShadow: 6,
        transition: "transform 0.2s, box-shadow 0.2s",
        animation: launcherAnimation(nudging, reducedMotion),
        "&:hover": { transform: "translateY(-2px)", boxShadow: 8 },
        "&:active": { transform: "scale(0.94)", boxShadow: 4 },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&:hover, &:active": { transform: "none" },
        },
      }}
    >
      <Badge
        badgeContent={unread}
        color="error"
        max={99}
        overlap="circular"
        slotProps={{ badge: { "aria-hidden": true } }}
        sx={{
          "& .MuiBadge-badge": {
            top: -10,
            right: -12,
            fontWeight: 700,
            boxShadow: "0 0 0 2px var(--mui-palette-background-paper)",
          },
        }}
      >
        <ChatBubbleRoundedIcon sx={{ fontSize: 26 }} />
      </Badge>
    </Fab>
  );
});

function launcherAnimation(nudging: boolean, reducedMotion: boolean): string {
  if (reducedMotion) {
    return "none";
  }
  return nudging ? `${nudge} ${NUDGE_MS}ms ease-out` : `${enter} 0.35s ease-out both`;
}
