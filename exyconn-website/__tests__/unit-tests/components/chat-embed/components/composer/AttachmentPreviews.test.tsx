// @vitest-environment jsdom
/** Thumbnails of what the next message will carry, each removable. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AttachmentPreviews } from "../../../../../../src/components/chat-embed/components/composer/AttachmentPreviews";
import type { PickedFile } from "../../../../../../src/components/chat-embed/hooks/useAttachments";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";

const PHOTO: PickedFile = { id: "file-1", name: "photo.png", data: "data:image/png;base64,AAAA" };
const CLIP: PickedFile = { id: "file-2", name: "clip.mp4", data: "data:video/mp4;base64,AAAA" };

describe("AttachmentPreviews", () => {
  it("renders nothing without files", () => {
    const { container } = renderInChatTheme(<AttachmentPreviews files={[]} onRemove={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists a picture as its thumbnail and a clip as a named icon", () => {
    const { container } = renderInChatTheme(
      <AttachmentPreviews files={[PHOTO, CLIP]} onRemove={vi.fn()} />
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "photo.png" })).toHaveAttribute("src", PHOTO.data);
    expect(container.querySelector('svg[aria-label="clip.mp4"]')).toBeInTheDocument();
  });

  it("removes the chosen file by its id", async () => {
    const onRemove = vi.fn();
    const { user } = renderInChatTheme(
      <AttachmentPreviews files={[PHOTO, CLIP]} onRemove={onRemove} />
    );
    await user.click(screen.getByRole("button", { name: strings.removeFile("clip.mp4") }));
    expect(onRemove).toHaveBeenCalledWith("file-2");
  });
});
