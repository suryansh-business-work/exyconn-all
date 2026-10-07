// @vitest-environment jsdom
/** The bar that replaces the composer while a voice note records. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VoiceBar } from "../../../../../../src/components/chat-embed/components/composer/VoiceBar";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";

function mount(seconds: number) {
  const onCancel = vi.fn();
  const onStop = vi.fn();
  const view = renderInChatTheme(
    <VoiceBar seconds={seconds} onCancel={onCancel} onStop={onStop} />
  );
  return { ...view, onCancel, onStop };
}

describe("VoiceBar", () => {
  it("shows the elapsed time as m:ss and focuses stop-and-send", () => {
    mount(65);
    expect(screen.getByRole("timer", { name: strings.recording })).toHaveTextContent("1:05");
    expect(screen.getByRole("button", { name: strings.stopSend })).toHaveFocus();
  });

  it("cancels the note", async () => {
    const { user, onCancel, onStop } = mount(3);
    await user.click(screen.getByRole("button", { name: strings.cancelRecording }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  it("stops and sends the note", async () => {
    const { user, onStop } = mount(3);
    await user.click(screen.getByRole("button", { name: strings.stopSend }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
