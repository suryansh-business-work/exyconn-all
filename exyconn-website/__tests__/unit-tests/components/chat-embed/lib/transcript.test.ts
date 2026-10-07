// @vitest-environment jsdom
/** The conversation as plain text, and saving it as chat-<ticket>.txt. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildTranscript,
  downloadTranscript,
} from "../../../../../src/components/chat-embed/lib/transcript";
import { formatFullTime } from "../../../../../src/components/chat-embed/lib/time";
import type { Threads } from "../../../../../src/components/chat-embed/state/state";
import { makeItem, makeSession } from "../chat-fixtures";
import { spyOnDownloads } from "../../download-spy";

const AT = "2026-10-07T09:30:00.000Z";
const session = makeSession({ name: "Riya", email: "riya@example.com", ticketReference: "WC-7" });

const threads: Threads = {
  LIVE: [
    makeItem({ id: "1", sender: "VISITOR", body: "Hello", createdAt: AT }),
    makeItem(
      { id: "2", sender: "AGENT", senderName: "Sam", body: "Hi Riya", createdAt: AT },
      { status: "sent" }
    ),
    makeItem(
      { id: "3", sender: "VISITOR", body: "never arrived", createdAt: AT },
      { status: "failed" }
    ),
  ],
  KNOWLEDGE: [
    makeItem({
      id: "4",
      channel: "KNOWLEDGE",
      sender: "BOT",
      senderName: "Exy",
      body: "Here is the guide",
      createdAt: AT,
      attachments: [
        { url: "https://cdn.example.com/g.png", name: "g.png", kind: "IMAGE", size: 9 },
      ],
    }),
    makeItem({ id: "5", channel: "KNOWLEDGE", body: "pending" }, { status: "sending" }),
  ],
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("buildTranscript", () => {
  it("lists both threads' delivered messages with who sent them and their files", () => {
    const when = formatFullTime(AT);
    expect(buildTranscript(session, threads)).toBe(
      [
        "Exyconn chat WC-7",
        "Riya <riya@example.com>",
        "",
        "Chat with us",
        "============",
        `[${when}] You: Hello`,
        `[${when}] Sam: Hi Riya`,
        "",
        "Knowledge Bot",
        "=============",
        `[${when}] Exy: Here is the guide`,
        "  [g.png] https://cdn.example.com/g.png",
        "",
      ].join("\n")
    );
  });

  it("keeps the headings when a thread is empty", () => {
    const text = buildTranscript(session, { LIVE: [], KNOWLEDGE: [] });
    expect(text).toContain("Chat with us\n============\n\nKnowledge Bot");
    expect(text).not.toContain("You:");
  });
});

describe("downloadTranscript", () => {
  it("saves the transcript as a text file named after the ticket and frees the URL", () => {
    vi.useFakeTimers();
    const downloads = spyOnDownloads();
    downloadTranscript(session, threads);

    expect(downloads.saved).toEqual([
      { href: "blob:http://localhost/1", download: "chat-WC-7.txt", attached: true },
    ]);
    expect(downloads.blobs[0].type).toBe("text/plain;charset=utf-8");
    expect(downloads.blobs[0].size).toBe(
      new TextEncoder().encode(buildTranscript(session, threads)).length
    );
    expect(document.querySelector("a[download]")).toBeNull();

    expect(downloads.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(downloads.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/1");
  });
});
