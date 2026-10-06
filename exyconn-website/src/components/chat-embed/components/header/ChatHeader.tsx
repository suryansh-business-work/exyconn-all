import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { ChatActions } from "../../state/controller";
import type { ChatState, Tab } from "../../state/state";
import { strings } from "../../strings";
import { BrandAvatar } from "../BrandAvatar";
import { ChatMenu } from "./ChatMenu";
import { HeaderStatus } from "./HeaderStatus";
import { SessionCountdown } from "./SessionCountdown";

interface ChatHeaderProps {
  titleId: string;
  state: ChatState;
  actions: ChatActions;
  tab: Tab;
  onClose: () => void;
}

/** Who the visitor is talking to, whether the team is in, and the chat's controls. */
export function ChatHeader({ titleId, state, actions, tab, onClose }: Readonly<ChatHeaderProps>) {
  const { config, session } = state;
  const bot = tab === "KNOWLEDGE";
  const title = bot ? (config?.botName ?? strings.tabKnowledge) : strings.defaultTitle;
  const showCountdown = session?.status === "OPEN" && tab !== "FAQS";

  return (
    <Box
      component="header"
      sx={{
        bgcolor: "chat.header",
        backgroundImage: "var(--mui-palette-chat-headerBg)",
        color: "chat.onHeader",
        pl: 2,
        pr: 1,
        pt: "max(14px, env(safe-area-inset-top))",
        pb: 1.75,
        "& .MuiIconButton-root:hover": { bgcolor: "chat.headerChip" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <BrandAvatar size={42} onBand />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            id={titleId}
            component="h1"
            sx={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
            }}
            noWrap
          >
            {title}
          </Typography>
          <HeaderStatus config={config} bot={bot} />
        </Box>
        <ChatMenu state={state} actions={actions} />
        <IconButton
          aria-label={strings.minimise}
          title={strings.minimise}
          onClick={onClose}
          sx={{ color: "inherit" }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </Box>
      {showCountdown && <SessionCountdown expiresAt={session.expiresAt} />}
    </Box>
  );
}
