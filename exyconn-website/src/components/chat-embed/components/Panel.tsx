import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Paper from "@mui/material/Paper";
import { keyframes } from "@mui/material/styles";
import type { ChatActions } from "../state/controller";
import type { ChatState, Tab } from "../state/state";
import { chatRadius } from "../theme";
import { ConnectionBar } from "./ConnectionBar";
import { ChatHeader } from "./header/ChatHeader";
import { SectionTabs } from "./SectionTabs";
import { ChatSection } from "./sections/ChatSection";
import { FaqSection } from "./sections/FaqSection";

const rise = keyframes`
  from { transform: translateY(16px); }
  to { transform: translateY(0); }
`;

interface PanelProps {
  state: ChatState;
  actions: ChatActions;
  tab: Tab;
  onTab: (tab: Tab) => void;
  /** The loader made the iframe full screen (a phone): no margin, no rounded corners. */
  compact: boolean;
  onClose: () => void;
  /** Set by the Fade transition around the panel. */
  style?: CSSProperties;
}

/** The open chat: header, the three sections as tabs, and whatever problem needs saying. */
export const Panel = forwardRef<HTMLDivElement, Readonly<PanelProps>>(function Panel(
  { state, actions, tab, onTab, compact, onClose, style },
  ref
) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const tabId = (value: Tab) => `${id}-tab-${value}`;
  const panelId = (value: Tab) => `${id}-panel-${value}`;
  const inset = compact ? 0 : 8;

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault();
      onClose();
    }
  };

  const setRefs = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const section = (value: Tab) => ({
    role: "tabpanel",
    id: panelId(value),
    "aria-labelledby": tabId(value),
    hidden: tab !== value,
  });

  return (
    <Paper
      ref={setRefs}
      style={style}
      role="dialog"
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      elevation={12}
      sx={{
        position: "absolute",
        right: inset,
        bottom: inset,
        width: `calc(100% - ${inset * 2}px)`,
        height: `calc(100% - ${inset * 2}px)`,
        maxWidth: compact ? "none" : 420,
        maxHeight: compact ? "none" : 700,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: compact ? 0 : chatRadius.panel,
        border: compact ? 0 : 1,
        borderColor: "chat.edge",
        outline: "none",
        animation: `${rise} 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)`,
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <ChatHeader
        titleId={`${id}-title`}
        state={state}
        actions={actions}
        tab={tab}
        onClose={onClose}
      />
      <ConnectionBar connection={state.connection} />
      <SectionTabs tab={tab} onTab={onTab} tabId={tabId} panelId={panelId} />
      <Collapse in={state.error !== ""} unmountOnExit>
        <Alert severity="error" onClose={actions.dismissError} sx={{ borderRadius: 0 }}>
          {state.error}
        </Alert>
      </Collapse>
      <Box {...section("LIVE")} sx={sectionSx}>
        <ChatSection
          channel="LIVE"
          state={state}
          actions={actions}
          active={tab === "LIVE"}
          onTab={onTab}
        />
      </Box>
      <Box {...section("KNOWLEDGE")} sx={sectionSx}>
        <ChatSection
          channel="KNOWLEDGE"
          state={state}
          actions={actions}
          active={tab === "KNOWLEDGE"}
          onTab={onTab}
        />
      </Box>
      <Box {...section("FAQS")} sx={sectionSx}>
        <FaqSection faqs={state.config?.faqs ?? []} onTab={onTab} />
      </Box>
    </Paper>
  );
});

const sectionSx = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  bgcolor: "background.default",
  "&[hidden]": { display: "none" },
} as const;
