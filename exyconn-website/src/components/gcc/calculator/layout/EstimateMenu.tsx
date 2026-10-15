import MoreVert from "@mui/icons-material/MoreVert";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { useId, useState } from "react";
import { UI } from "../strings/ui";

export interface EstimateActions {
  create: () => void;
  rename: () => void;
  duplicate: () => void;
  remove: () => void;
  reset: () => void;
}

const ITEMS = [
  ["create", UI.estimates.create],
  ["rename", UI.estimates.rename],
  ["duplicate", UI.estimates.duplicate],
  ["reset", UI.estimates.reset],
  ["remove", UI.estimates.remove],
] as const;

/** New, rename, duplicate, reset and delete for the open estimate. */
export function EstimateMenu({ actions }: Readonly<{ actions: EstimateActions }>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  return (
    <>
      <Tooltip title={UI.estimates.menu}>
        <IconButton
          aria-label={UI.estimates.menu}
          aria-haspopup="menu"
          aria-controls={anchor ? menuId : undefined}
          aria-expanded={anchor ? "true" : undefined}
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Menu id={menuId} anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {ITEMS.map(([key, label]) => (
          <MenuItem
            key={key}
            onClick={() => {
              setAnchor(null);
              actions[key]();
            }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
