import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import { useCountdown } from "../../hooks/useCountdown";
import { formatDuration } from "../../lib/time";
import { strings } from "../../strings";
import { visuallyHidden } from "../sx";

/** The last two minutes are emphasised and announced. */
const WARNING_SECONDS = 120;
/** Screen readers hear the warning at these points only, never every second. */
const ANNOUNCE_AT = [120, 60, 30];

/** "Chat ends in 9:41 without a reply", from the session's `expiresAt`. */
export function SessionCountdown({ expiresAt }: Readonly<{ expiresAt: string | null }>) {
  const seconds = useCountdown(expiresAt);
  const [announcement, setAnnouncement] = useState("");
  const announced = useRef<number | null>(null);

  useEffect(() => {
    if (seconds === null) {
      return;
    }
    const mark = ANNOUNCE_AT.find((point) => seconds <= point && seconds > point - 2);
    if (mark !== undefined && announced.current !== mark) {
      announced.current = mark;
      setAnnouncement(strings.endsSoon(Math.ceil(seconds / 60)));
    }
    if (seconds > WARNING_SECONDS) {
      announced.current = null;
    }
  }, [seconds]);

  if (seconds === null) {
    return null;
  }
  const warning = seconds <= WARNING_SECONDS;

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography
        component="p"
        variant="caption"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          pl: 1,
          pr: 1.25,
          py: 0.5,
          borderRadius: 999,
          fontWeight: warning ? 700 : 500,
          lineHeight: 1.3,
          bgcolor: warning ? "warning.main" : "chat.headerChip",
          color: warning ? "warning.contrastText" : "chat.onHeader",
          fontVariantNumeric: "tabular-nums",
          transition: "background-color 0.2s",
        }}
      >
        <TimerOutlinedIcon sx={{ fontSize: 14 }} />
        {strings.endsIn(formatDuration(seconds))}
      </Typography>
      <Box component="span" role="status" sx={visuallyHidden}>
        {announcement}
      </Box>
    </Box>
  );
}
