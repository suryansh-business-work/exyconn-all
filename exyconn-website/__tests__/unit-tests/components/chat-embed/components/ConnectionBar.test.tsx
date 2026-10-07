// @vitest-environment jsdom
/** The thin strip that says the socket is (re)connecting. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConnectionBar } from "../../../../../src/components/chat-embed/components/ConnectionBar";
import { strings } from "../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../test-utils";

describe("ConnectionBar", () => {
  it.each([
    ["connecting", strings.connecting],
    ["reconnecting", strings.reconnecting],
  ] as const)("announces %s", (connection, label) => {
    renderInChatTheme(<ConnectionBar connection={connection} />);
    expect(screen.getByRole("status")).toHaveTextContent(label);
  });

  it.each(["open", "idle"] as const)("says nothing while %s", (connection) => {
    renderInChatTheme(<ConnectionBar connection={connection} />);
    expect(screen.getByRole("status").textContent).toBe("");
  });
});
