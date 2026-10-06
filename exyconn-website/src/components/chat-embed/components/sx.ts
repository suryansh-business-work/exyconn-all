/** Read by screen readers, invisible on screen. */
export const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

/** The site's eyebrow label ("02 — DELIVERABLES"): small mono capitals, widely tracked. */
export const eyebrow = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "0.68rem",
  fontWeight: 500,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "text.secondary",
} as const;

/** A round button filled with the brand gradient: send, and send a voice note. */
export const accentButton = {
  width: 40,
  height: 40,
  flexShrink: 0,
  color: "chat.onAccent",
  backgroundImage: "var(--mui-palette-chat-accent)",
  boxShadow: 2,
  transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
  "&:hover": { boxShadow: 4, transform: "translateY(-1px)" },
  "&:active": { transform: "scale(0.95)" },
  "&.Mui-disabled": {
    color: "text.disabled",
    backgroundImage: "none",
    bgcolor: "chat.track",
    boxShadow: 0,
  },
  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",
    "&:hover, &:active": { transform: "none" },
  },
} as const;
