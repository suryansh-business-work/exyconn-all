// @vitest-environment jsdom
/** The online dot, Online/Offline and today's opening hours under the header title. */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderStatus } from "../../../../../../src/components/chat-embed/components/header/HeaderStatus";
import { todayHours } from "../../../../../../src/components/chat-embed/lib/hours";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";
import { makeConfig } from "../../chat-fixtures";

vi.mock("../../../../../../src/components/chat-embed/lib/hours", () => ({ todayHours: vi.fn() }));

const OPEN_TODAY = { open: true, start: "09:00", end: "18:00", zone: "GMT+5:30" };

beforeEach(() => {
  vi.mocked(todayHours).mockReset();
});

describe("HeaderStatus", () => {
  it("renders nothing before the config arrives", () => {
    const { container } = renderInChatTheme(<HeaderStatus config={null} bot={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the team online with today's hours in its timezone", () => {
    vi.mocked(todayHours).mockReturnValue(OPEN_TODAY);
    const config = makeConfig({ timezone: "Asia/Kolkata" });
    renderInChatTheme(<HeaderStatus config={config} bot={false} />);
    expect(screen.getByText(strings.online)).toBeInTheDocument();
    expect(
      screen.getByText(`${strings.todayHours("09:00", "18:00")} GMT+5:30`)
    ).toBeInTheDocument();
    expect(todayHours).toHaveBeenCalledWith(config.weeklyHours, "Asia/Kolkata");
  });

  it("shows the team offline and closed today", () => {
    vi.mocked(todayHours).mockReturnValue({ ...OPEN_TODAY, open: false });
    renderInChatTheme(<HeaderStatus config={makeConfig({ online: false })} bot={false} />);
    expect(screen.getByText(strings.offline)).toBeInTheDocument();
    expect(screen.getByText(strings.closedToday)).toBeInTheDocument();
  });

  it("leaves the hours out when they cannot be read", () => {
    vi.mocked(todayHours).mockReturnValue(null);
    const { container } = renderInChatTheme(<HeaderStatus config={makeConfig()} bot={false} />);
    expect(container.querySelector("p")).toHaveTextContent(/^Online$/);
  });

  it("keeps the Knowledge Bot online, whatever the team's hours", () => {
    const { container } = renderInChatTheme(
      <HeaderStatus config={makeConfig({ online: false })} bot />
    );
    expect(container.querySelector("p")).toHaveTextContent(/^Online$/);
    expect(todayHours).not.toHaveBeenCalled();
  });
});
