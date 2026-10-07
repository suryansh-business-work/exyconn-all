/** The chat's English copy: every sentence built from a value reads correctly. */
import { describe, expect, it } from "vitest";
import { strings } from "../../../../src/components/chat-embed/strings";

describe("chat strings", () => {
  it("counts unread messages in the singular and plural", () => {
    expect(strings.unread(1)).toBe("1 unread message");
    expect(strings.unread(0)).toBe("0 unread messages");
    expect(strings.unread(3)).toBe("3 unread messages");
  });

  it("warns that the chat is ending in under a minute or in minutes", () => {
    expect(strings.endsSoon(0)).toBe("This chat ends in under a minute without a reply.");
    expect(strings.endsSoon(1)).toBe("This chat ends in under a minute without a reply.");
    expect(strings.endsSoon(2)).toBe("This chat ends in 2 minutes without a reply.");
    expect(strings.endsIn("4:59")).toBe("Chat ends in 4:59 without a reply");
  });

  it("states opening hours, codes and resend timing", () => {
    expect(strings.todayHours("09:00", "18:00")).toBe("Today 09:00–18:00");
    expect(strings.codeSentTo("meera@example.com")).toBe(
      "We emailed a 6-digit code to meera@example.com."
    );
    expect(strings.resendIn(30)).toBe("Resend code in 30s");
  });

  it("labels the conversation and the composer per section", () => {
    expect(strings.conversation("Knowledge Bot")).toBe("Knowledge Bot conversation");
    expect(strings.messageLabel("Chat with us")).toBe("Message Chat with us");
    expect(strings.charsLeft(12)).toBe("12 characters left");
  });

  it("explains refused files by name", () => {
    expect(strings.removeFile("a.png")).toBe("Remove a.png");
    expect(strings.fileTooBig("clip.mp4", 10)).toBe("clip.mp4 is larger than 10 MB.");
    expect(strings.fileType("notes.pdf")).toBe("notes.pdf is not a picture or a video.");
    expect(strings.openAttachment("a.png")).toBe("Open a.png in a new tab");
  });

  it("names who is typing, chatting and writing", () => {
    expect(strings.typing("Asha")).toBe("Asha is typing");
    expect(strings.chattingWith("Asha")).toBe("You're chatting with Asha");
    expect(strings.knowledgeIntroTitle("Exy")).toBe("Hi, I'm Exy");
    expect(strings.newMessageFrom("Asha", "Hello")).toBe("New message from Asha: Hello");
    expect(strings.attachmentFrom("Asha")).toBe("Asha sent an attachment");
  });

  it("titles the downloaded transcript with the ticket reference", () => {
    expect(strings.transcriptTitle("WC-1042")).toBe("Exyconn chat WC-1042");
  });

  it("keeps the fixed labels non-empty", () => {
    const fixed = Object.entries(strings).filter(([, value]) => typeof value === "string");
    expect(fixed.length).toBeGreaterThan(50);
    for (const [, value] of fixed) {
      expect(String(value).trim()).not.toBe("");
    }
  });
});
