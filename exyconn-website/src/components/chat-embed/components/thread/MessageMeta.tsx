import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { formatTime } from "../../lib/time";
import type { ThreadItem } from "../../state/state";
import { strings } from "../../strings";

interface MessageMetaProps {
  item: ThreadItem;
  /** The time shows under the last bubble of a group only. */
  show: boolean;
  seen: boolean;
  onRetry: (key: string) => void;
  onDiscard: (key: string) => void;
}

/** Under a bubble: its time, "Sending…", "Seen", or "Not sent" with Retry and Dismiss. */
export function MessageMeta({ item, show, seen, onRetry, onDiscard }: Readonly<MessageMetaProps>) {
  if (item.status === "failed") {
    return (
      <Box
        role="alert"
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5, mt: 0.25 }}
      >
        <ErrorOutlineRoundedIcon color="error" sx={{ fontSize: 16 }} />
        <Typography variant="caption" sx={{ color: "error.main", fontWeight: 600 }}>
          {item.error ?? strings.failed}
        </Typography>
        <Button size="small" onClick={() => onRetry(item.key)} sx={{ minWidth: 0, py: 0 }}>
          {strings.retry}
        </Button>
        <Button
          size="small"
          color="inherit"
          onClick={() => onDiscard(item.key)}
          sx={{ minWidth: 0, py: 0, color: "text.secondary" }}
        >
          {strings.dismiss}
        </Button>
      </Box>
    );
  }
  if (!show && !seen) {
    return null;
  }
  const status = item.status === "sending" ? strings.sending : formatTime(item.message.createdAt);
  return (
    <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, mx: 0.5 }}>
      {status}
      {seen && ` · ${strings.seen}`}
    </Typography>
  );
}
