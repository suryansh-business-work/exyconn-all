import { useId, useState } from "react";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import type { ChatActions } from "../../state/controller";
import type { ChatState } from "../../state/state";
import { strings } from "../../strings";
import { EndChatDialog } from "./EndChatDialog";

interface ChatMenuProps {
  state: ChatState;
  actions: ChatActions;
}

/** Sound, download and end chat, behind one keyboard-accessible menu. */
export function ChatMenu({ state, actions }: Readonly<ChatMenuProps>) {
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [confirming, setConfirming] = useState(false);
  const hasSession = state.session !== null;
  const canEnd = state.session?.status === "OPEN";
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        id={`${id}-button`}
        aria-label={strings.settings}
        title={strings.settings}
        aria-haspopup="menu"
        aria-controls={anchor ? `${id}-menu` : undefined}
        aria-expanded={anchor ? "true" : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ color: "inherit" }}
      >
        <MoreVertRoundedIcon />
      </IconButton>
      <Menu
        id={`${id}-menu`}
        anchorEl={anchor}
        open={anchor !== null}
        onClose={close}
        slotProps={{ list: { "aria-labelledby": `${id}-button`, dense: true } }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          role="menuitemcheckbox"
          aria-checked={state.soundOn}
          onClick={() => actions.setSound(!state.soundOn)}
        >
          <ListItemIcon>
            {state.soundOn ? <VolumeUpRoundedIcon /> : <VolumeOffRoundedIcon />}
          </ListItemIcon>
          <ListItemText>{strings.sound}</ListItemText>
          <Switch
            edge="end"
            size="small"
            checked={state.soundOn}
            tabIndex={-1}
            slotProps={{ input: { "aria-hidden": true } }}
          />
        </MenuItem>
        <MenuItem
          disabled={!hasSession}
          onClick={() => {
            close();
            actions.download();
          }}
        >
          <ListItemIcon>
            <DownloadRoundedIcon />
          </ListItemIcon>
          <ListItemText>{strings.download}</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={!canEnd}
          onClick={() => {
            close();
            setConfirming(true);
          }}
        >
          <ListItemIcon>
            <PowerSettingsNewRoundedIcon />
          </ListItemIcon>
          <ListItemText>{strings.endChat}</ListItemText>
        </MenuItem>
      </Menu>
      <EndChatDialog
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          actions.endChat();
        }}
      />
    </>
  );
}
