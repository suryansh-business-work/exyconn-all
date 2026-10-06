import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import { useColorScheme } from "@mui/material/styles";
import { useChat } from "../hooks/useChat";
import { useHostBridge } from "../hooks/useHostBridge";
import { useTabParam } from "../hooks/useTabParam";
import type { FrameSize, FromHost } from "../lib/host";
import type { ChatSite } from "../types";
import { Launcher } from "./Launcher";
import { Panel } from "./Panel";

interface ChatWidgetProps {
  socketUrl: string;
  site: ChatSite;
  reducedMotion: boolean;
}

/** The launcher and the panel, and everything that ties them to the host page. */
export function ChatWidget({ socketUrl, site, reducedMotion }: Readonly<ChatWidgetProps>) {
  const { state, actions } = useChat(socketUrl, site);
  const [tab, setTab] = useTabParam();
  const { setMode } = useColorScheme();
  const [compact, setCompact] = useState(false);
  // The panel keeps the iframe open until its closing animation has finished.
  const [panelShown, setPanelShown] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  const onHostMessage = useCallback(
    (message: FromHost) => {
      if (message.type === "page") {
        actions.setPageUrl(message.url);
      } else if (message.type === "theme") {
        setMode(message.theme);
      } else {
        setCompact(message.compact);
      }
    },
    [actions, setMode]
  );

  let size: FrameSize = "closed";
  if (state.config?.enabled === false) {
    size = "hidden";
  } else if (state.open || panelShown) {
    size = "open";
  }
  useHostBridge({ size, unread: state.unread, onMessage: onHostMessage });

  useEffect(() => {
    if (state.open) {
      setPanelShown(true);
    }
  }, [state.open]);

  const close = useCallback(() => {
    restoreFocus.current = true;
    actions.close();
  }, [actions]);

  const onExited = useCallback(() => {
    setPanelShown(false);
    if (restoreFocus.current) {
      restoreFocus.current = false;
      // The launcher is back once the panel is gone.
      requestAnimationFrame(() => launcherRef.current?.focus());
    }
  }, []);

  if (size === "hidden") {
    return null;
  }

  return (
    <Box sx={{ position: "fixed", inset: 0 }}>
      {!panelShown && !state.open && (
        <Launcher
          ref={launcherRef}
          unread={state.unread}
          nudges={state.nudges}
          reducedMotion={reducedMotion}
          onOpen={actions.open}
        />
      )}
      {/* A fade, with the panel's own rise on mount: a scaling transition would make the
          tab bar measure its thumb at the wrong size. */}
      <Fade in={state.open} onExited={onExited} unmountOnExit>
        <Panel
          state={state}
          actions={actions}
          tab={tab}
          onTab={setTab}
          compact={compact}
          onClose={close}
        />
      </Fade>
    </Box>
  );
}
