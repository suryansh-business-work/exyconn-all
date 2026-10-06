import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { strings } from "../../strings";
import type { VisitorSession, WidgetConfig } from "../../types";

interface LiveNoticesProps {
  config: WidgetConfig | null;
  session: VisitorSession;
}

/** Above the live thread: who has the chat, and the offline message outside opening hours. */
export function LiveNotices({ config, session }: Readonly<LiveNoticesProps>) {
  const offline = config?.online === false && session.status === "OPEN";
  if (!offline && !session.agentName) {
    return null;
  }
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
      {session.agentName && (
        <Typography
          variant="caption"
          component="div"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 0.875,
            color: "text.secondary",
            fontWeight: 500,
          }}
        >
          <Avatar
            aria-hidden
            sx={{
              width: 22,
              height: 22,
              fontSize: "0.65rem",
              fontWeight: 700,
              bgcolor: "chat.agent",
              color: "chat.onAgent",
            }}
          >
            {session.agentName.charAt(0).toUpperCase()}
          </Avatar>
          {strings.chattingWith(session.agentName)}
        </Typography>
      )}
      {offline && (
        <Alert
          severity="info"
          icon={false}
          sx={{
            borderRadius: 0,
            py: 0,
            fontSize: "0.8rem",
            bgcolor: "chat.tint",
            color: "text.primary",
          }}
        >
          {config.offlineMessage}
        </Alert>
      )}
    </Box>
  );
}
