// @vitest-environment jsdom
/** Pictures, clips and voice notes inline in a bubble. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Attachments } from "../../../../../../src/components/chat-embed/components/thread/Attachments";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import type { ChatAttachment } from "../../../../../../src/components/chat-embed/types";
import { renderInChatTheme } from "../../../../test-utils";

const media = (overrides: Partial<ChatAttachment>): ChatAttachment => ({
  url: "https://media.example.test/photo.png",
  name: "photo.png",
  kind: "IMAGE",
  size: 100,
  ...overrides,
});

describe("Attachments", () => {
  it("renders nothing for no files, or for links the chat cannot vouch for", () => {
    const { container, rerender } = renderInChatTheme(<Attachments files={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<Attachments files={[media({ url: "blob:https://media.example.test/1" })]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens a server picture full size in a new tab", () => {
    renderInChatTheme(<Attachments files={[media({})]} />);
    const link = screen.getByRole("link", { name: strings.openAttachment("photo.png") });
    expect(link).toHaveAttribute("href", "https://media.example.test/photo.png");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("img", { name: "photo.png" })).toHaveAttribute("loading", "lazy");
  });

  it("shows a preview being sent without a link", () => {
    const data = "data:image/png;base64,AAAA";
    renderInChatTheme(<Attachments files={[media({ url: data })]} />);
    expect(screen.getByRole("img", { name: "photo.png" })).toHaveAttribute("src", data);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("plays clips and voice notes with controls, dropping unsafe ones", () => {
    const { container } = renderInChatTheme(
      <Attachments
        files={[
          media({ url: "https://media.example.test/clip.mp4", name: "clip.mp4", kind: "VIDEO" }),
          media({ url: "http://media.example.test/note.webm", name: "note.webm", kind: "AUDIO" }),
          media({ url: "ftp://media.example.test/x.png", name: "x.png" }),
        ]}
      />
    );
    const video = container.querySelector("video");
    const audio = container.querySelector("audio");
    expect(video).toHaveAttribute("aria-label", "clip.mp4");
    expect(video).toHaveAttribute("controls");
    expect(audio).toHaveAttribute("aria-label", "note.webm");
    expect(audio).toHaveAttribute("preload", "metadata");
    expect(screen.queryByRole("img", { name: "x.png" })).not.toBeInTheDocument();
  });
});
