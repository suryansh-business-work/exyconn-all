import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { todayHours } from "../../lib/hours";
import { strings } from "../../strings";
import type { WidgetConfig } from "../../types";

interface HeaderStatusProps {
  config: WidgetConfig | null;
  /** The Knowledge Bot is always in, whatever the team's hours. */
  bot: boolean;
}

function hoursText(config: Readonly<WidgetConfig>): string {
  const today = todayHours(config.weeklyHours, config.timezone);
  if (!today) {
    return "";
  }
  if (!today.open) {
    return strings.closedToday;
  }
  return `${strings.todayHours(today.start, today.end)} ${today.zone}`;
}

/** The online dot, "Online"/"Offline" and today's opening hours. */
export function HeaderStatus({ config, bot }: Readonly<HeaderStatusProps>) {
  if (!config) {
    return null;
  }
  const online = bot || config.online;
  const hours = bot ? "" : hoursText(config);
  return (
    <Typography
      component="p"
      variant="caption"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: 1,
        rowGap: 0,
        mt: 0.25,
        lineHeight: 1.4,
        color: "chat.onHeaderMuted",
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          bgcolor: online ? "chat.online" : "chat.offline",
        }}
      />
      {online ? strings.online : strings.offline}
      {hours && (
        <Box component="span" sx={{ whiteSpace: "nowrap" }}>
          {hours}
        </Box>
      )}
    </Typography>
  );
}
