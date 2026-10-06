import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";
import ThumbDownAltRoundedIcon from "@mui/icons-material/ThumbDownAltRounded";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import { isSafeUrl } from "../../lib/files";
import { strings } from "../../strings";
import type { ChatMessage, ChatSource, Feedback } from "../../types";
import { eyebrow } from "../sx";

/** The pages a bot answer was built from, as link chips. */
export function Sources({ sources }: Readonly<{ sources: readonly ChatSource[] }>) {
  const safe = sources.filter((source) => isSafeUrl(source.url));
  if (safe.length === 0) {
    return null;
  }
  return (
    <Box
      component="nav"
      aria-label={strings.sources}
      sx={{ mt: 1.25, pt: 1, borderTop: 1, borderColor: "divider" }}
    >
      <Typography component="p" sx={eyebrow}>
        {strings.sources}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
        {safe.map((source) => (
          <Chip
            key={source.url}
            component="a"
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            clickable
            size="small"
            variant="outlined"
            icon={<LinkRoundedIcon />}
            label={source.title || source.url}
            sx={{
              maxWidth: "100%",
              bgcolor: "background.default",
              color: "text.primary",
              "& .MuiChip-icon": { color: "primary.main" },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

/** Follow-up questions; choosing one asks it in the same thread. */
export function Suggestions({
  suggestions,
  onAsk,
}: Readonly<{ suggestions: readonly string[]; onAsk: (text: string) => void }>) {
  if (suggestions.length === 0) {
    return null;
  }
  return (
    <Box
      role="group"
      aria-label={strings.suggestions}
      sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}
    >
      {suggestions.map((text) => (
        <Chip
          key={text}
          label={text}
          variant="outlined"
          clickable
          onClick={() => onAsk(text)}
          icon={<AutoAwesomeRoundedIcon />}
          sx={suggestionSx}
        />
      ))}
    </Box>
  );
}

interface RatingProps {
  message: ChatMessage;
  onRate: (helpful: boolean) => void;
}

/** Thumbs up/down on a bot answer, once: the server's `messageUpdated` records the choice. */
export function Rating({ message, onRate }: Readonly<RatingProps>) {
  const [sent, setSent] = useState<Feedback | null>(null);
  const choice = message.feedback ?? sent;
  const rate = (value: Feedback) => {
    setSent(value);
    onRate(value === "UP");
  };
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        mt: 0.5,
        color: "text.secondary",
        "& .MuiIconButton-root": { color: "inherit", fontSize: "1rem" },
      }}
    >
      <IconButton
        size="small"
        aria-label={strings.helpful}
        aria-pressed={choice === "UP"}
        disabled={choice !== null}
        onClick={() => rate("UP")}
      >
        {choice === "UP" ? (
          <ThumbUpAltRoundedIcon fontSize="inherit" color="primary" />
        ) : (
          <ThumbUpAltOutlinedIcon fontSize="inherit" />
        )}
      </IconButton>
      <IconButton
        size="small"
        aria-label={strings.notHelpful}
        aria-pressed={choice === "DOWN"}
        disabled={choice !== null}
        onClick={() => rate("DOWN")}
      >
        {choice === "DOWN" ? (
          <ThumbDownAltRoundedIcon fontSize="inherit" color="primary" />
        ) : (
          <ThumbDownAltOutlinedIcon fontSize="inherit" />
        )}
      </IconButton>
      {choice && (
        <Typography variant="caption" role="status" sx={{ color: "text.secondary" }}>
          {strings.thanksFeedback}
        </Typography>
      )}
    </Box>
  );
}

const suggestionSx = {
  height: "auto",
  py: 0.75,
  color: "text.primary",
  borderColor: "chat.edge",
  bgcolor: "background.paper",
  transition: "border-color 0.15s, background-color 0.15s",
  "& .MuiChip-label": { whiteSpace: "normal" },
  "& .MuiChip-icon": { color: "chat.onAgent", fontSize: 16 },
  "&:hover": { borderColor: "chat.onAgent", bgcolor: "chat.agent" },
} as const;
