// @vitest-environment jsdom
/** The brand mark tile beside the header, the bot's answers and the welcome screens. */
import { describe, expect, it } from "vitest";
import { BrandAvatar } from "../../../../../src/components/chat-embed/components/BrandAvatar";
import { BrandMarkContext } from "../../../../../src/components/chat-embed/lib/brand";
import { renderInChatTheme } from "../../../test-utils";

const MARK = "https://cdn.example.test/mark.svg";

describe("BrandAvatar", () => {
  it("shows the site's mark as decoration only", () => {
    const { container } = renderInChatTheme(
      <BrandMarkContext.Provider value={MARK}>
        <BrandAvatar size={42} />
      </BrandMarkContext.Provider>
    );
    const tile = container.firstElementChild;
    expect(tile).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("img")).toHaveAttribute("src", MARK);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("draws the same mark on the header band", () => {
    const { container } = renderInChatTheme(
      <BrandMarkContext.Provider value={MARK}>
        <BrandAvatar size={28} onBand />
      </BrandMarkContext.Provider>
    );
    expect(container.querySelector("img")).toHaveAttribute("src", MARK);
  });

  it("falls back to a plain tile when the site has no mark", () => {
    const { container } = renderInChatTheme(<BrandAvatar size={28} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
