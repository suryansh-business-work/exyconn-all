import type { ThreadItem, Threads } from "../state/state";
import { strings } from "../strings";
import type { VisitorSession } from "../types";
import { formatFullTime } from "./time";

function line(item: Readonly<ThreadItem>): string {
  const { message } = item;
  const who = message.sender === "VISITOR" ? strings.you : message.senderName;
  const files = message.attachments.map((file) => `  [${file.name}] ${file.url}`);
  return [`[${formatFullTime(message.createdAt)}] ${who}: ${message.body}`, ...files].join("\n");
}

function section(title: string, items: readonly ThreadItem[]): string {
  const sent = items.filter((item) => item.status === "sent");
  return [title, "=".repeat(title.length), ...sent.map(line)].join("\n");
}

/** Both threads as plain text, built in the browser. */
export function buildTranscript(session: Readonly<VisitorSession>, threads: Threads): string {
  return [
    strings.transcriptTitle(session.ticketReference),
    `${session.name} <${session.email}>`,
    "",
    section(strings.tabLive, threads.LIVE),
    "",
    section(strings.tabKnowledge, threads.KNOWLEDGE),
    "",
  ].join("\n");
}

/** Saves the transcript as chat-<ticketReference>.txt. */
export function downloadTranscript(session: Readonly<VisitorSession>, threads: Threads): void {
  const blob = new Blob([buildTranscript(session, threads)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `chat-${session.ticketReference}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
