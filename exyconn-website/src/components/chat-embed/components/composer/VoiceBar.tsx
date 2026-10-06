import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { formatDuration } from "../../lib/time";
import { strings } from "../../strings";
import { accentButton } from "../sx";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

interface VoiceBarProps {
  seconds: number;
  onCancel: () => void;
  onStop: () => void;
}

/** Replaces the composer while a voice note records: timer, cancel, stop and send. */
export function VoiceBar({ seconds, onCancel, onStop }: Readonly<VoiceBarProps>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 48 }}>
      <IconButton aria-label={strings.cancelRecording} onClick={onCancel}>
        <DeleteOutlineRoundedIcon />
      </IconButton>
      <Box
        aria-hidden
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: "error.main",
          animation: `${pulse} 1.2s infinite`,
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      />
      <Typography
        sx={{ flex: 1, fontVariantNumeric: "tabular-nums" }}
        role="timer"
        aria-label={strings.recording}
      >
        {formatDuration(seconds)}
      </Typography>
      <IconButton aria-label={strings.stopSend} onClick={onStop} autoFocus sx={accentButton}>
        <SendRoundedIcon />
      </IconButton>
    </Box>
  );
}
