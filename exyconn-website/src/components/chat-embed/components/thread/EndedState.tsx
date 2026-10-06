import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AddCommentRoundedIcon from "@mui/icons-material/AddCommentRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { strings } from "../../strings";

interface EndedStateProps {
  onNewChat: () => void;
  onDownload: () => void;
}

/** In place of the composer once the chat is CLOSED. */
export function EndedState({ onNewChat, onDownload }: Readonly<EndedStateProps>) {
  return (
    <Box
      role="status"
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        textAlign: "center",
      }}
    >
      <Typography sx={{ fontWeight: 700 }}>{strings.ended}</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
        {strings.endedHint}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
        <Button variant="contained" startIcon={<AddCommentRoundedIcon />} onClick={onNewChat}>
          {strings.newChat}
        </Button>
        <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={onDownload}>
          {strings.download}
        </Button>
      </Box>
    </Box>
  );
}
