import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import type { Connection } from "../lib/socket";
import { strings } from "../strings";

const LABEL: Readonly<Partial<Record<Connection, string>>> = {
  connecting: strings.connecting,
  reconnecting: strings.reconnecting,
};

/** A thin "Reconnecting…" strip while the socket is not open. */
export function ConnectionBar({ connection }: Readonly<{ connection: Connection }>) {
  const label = LABEL[connection];
  return (
    <Box role="status" aria-live="polite">
      <Collapse in={label !== undefined}>
        <LinearProgress aria-hidden sx={{ height: 2 }} />
        <Typography
          variant="caption"
          component="p"
          sx={{ px: 2, py: 0.5, color: "text.secondary", bgcolor: "background.default" }}
        >
          {label}
        </Typography>
      </Collapse>
    </Box>
  );
}
