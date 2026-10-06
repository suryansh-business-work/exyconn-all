import { useMemo } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Fade from "@mui/material/Fade";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import type { ChatActions } from "../../state/controller";
import type { Tab, ThreadItem } from "../../state/state";
import { strings } from "../../strings";
import type { Channel, VisitorSession, WidgetConfig } from "../../types";
import { DaySeparator } from "./DaySeparator";
import { KnowledgeIntro, LiveIntro } from "./Intros";
import { LiveNotices } from "./LiveNotices";
import { MessageRow } from "./MessageRow";
import { lastSeenKey, threadRows } from "./rows";
import { TypingIndicator } from "./TypingIndicator";

interface ThreadProps {
  channel: Channel;
  items: readonly ThreadItem[];
  typing: string;
  config: WidgetConfig | null;
  session: VisitorSession;
  /** The visitor can see this thread now (its tab is open and so is the panel). */
  visible: boolean;
  actions: ChatActions;
  onTab: (tab: Tab) => void;
}

/** One thread's messages, newest at the bottom, announced politely as they arrive. */
export function Thread(props: Readonly<ThreadProps>) {
  const { channel, items, typing, config, session, visible, actions, onTab } = props;
  const rows = useMemo(() => threadRows(items), [items]);
  const seenKey = channel === "LIVE" ? lastSeenKey(items) : null;
  const newestKey = items.at(-1)?.key;
  const { ref, onScroll, hasNew, scrollToBottom } = useAutoScroll(
    items.length + (typing ? 1 : 0),
    visible
  );
  const section = channel === "LIVE" ? strings.tabLive : strings.tabKnowledge;
  const ask = (text: string) => actions.send(channel, text, []);
  const retry = (key: string) => actions.retry(channel, key);
  const discard = (key: string) => actions.discard(channel, key);

  let intro = null;
  if (items.length === 0) {
    intro =
      channel === "KNOWLEDGE" ? (
        <KnowledgeIntro config={config} onAsk={ask} onTalkToPerson={() => onTab("LIVE")} />
      ) : (
        <LiveIntro config={config} />
      );
  }

  return (
    <Box
      sx={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      {channel === "LIVE" && <LiveNotices config={config} session={session} />}
      <Box
        ref={ref}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={strings.conversation(section)}
        tabIndex={0}
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          pt: 1,
          pb: 2,
          "&:focus-visible": {
            outline: "3px solid",
            outlineColor: "chat.focus",
            outlineOffset: -3,
          },
        }}
      >
        {intro}
        {rows.map((row) =>
          row.kind === "day" ? (
            <DaySeparator key={row.key} label={row.label} />
          ) : (
            <MessageRow
              key={row.key}
              item={row.item}
              first={row.first}
              last={row.last}
              seen={row.key === seenKey}
              newest={row.key === newestKey}
              onAsk={ask}
              onRate={actions.rate}
              onRetry={retry}
              onDiscard={discard}
            />
          )
        )}
        {typing && <TypingIndicator name={typing} />}
      </Box>
      <Fade in={hasNew}>
        <Chip
          icon={<ArrowDownwardRoundedIcon />}
          label={strings.newMessages}
          color="primary"
          onClick={scrollToBottom}
          sx={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            boxShadow: 3,
          }}
        />
      </Fade>
    </Box>
  );
}
