// @vitest-environment jsdom
/** The summary panel island: it follows the shared draft and downloads the summary. */
import { act, renderHook, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuoteSummary } from "../../../../../src/components/company/quote";
import { downloadSummary } from "../../../../../src/components/company/quote/download";
import {
  setQuoteDraft,
  useQuoteDraft,
  type QuoteDraft,
} from "../../../../../src/components/company/quote/quote-store";
import { DEFAULT_QUOTE_INPUT } from "../../../../../src/lib/company/quote";
import { renderWithUser } from "../../../test-utils";
import { quoteText } from "../company-fixtures";

vi.mock("../../../../../src/components/company/quote/download", () => ({
  downloadSummary: vi.fn(),
}));

const { summary } = quoteText;
const INITIAL: QuoteDraft = { input: DEFAULT_QUOTE_INPUT, description: "" };
const AI_DRAFT: QuoteDraft = {
  input: {
    ...DEFAULT_QUOTE_INPUT,
    projectTypeId: "ai",
    team: [{ roleId: "ai-ml", count: 2, rate: 60, customLabel: "" }],
    durationId: "1w",
  },
  description: "A support bot",
};

const panel = () => <QuoteSummary text={summary} contactEmail={quoteText.contactEmail} />;

beforeEach(() => {
  setQuoteDraft(INITIAL);
  vi.mocked(downloadSummary).mockClear();
});

describe("useQuoteDraft", () => {
  it("follows every draft the form writes and stops when unmounted", () => {
    const { result, unmount } = renderHook(() => useQuoteDraft());
    expect(result.current).toEqual(INITIAL);
    act(() => setQuoteDraft(AI_DRAFT));
    expect(result.current).toBe(AI_DRAFT);
    unmount();
    setQuoteDraft(INITIAL);
    expect(result.current).toBe(AI_DRAFT);
  });
});

describe("QuoteSummary", () => {
  it("shows the total and breakdown of the current draft", () => {
    renderWithUser(panel());
    expect(screen.getByRole("heading", { name: summary.title })).toBeInTheDocument();
    expect(screen.getByText("$24,480")).toHaveClass("quote-total");
    expect(screen.getByText(summary.note)).toBeInTheDocument();
    expect(screen.getByText("3 months")).toBeInTheDocument();
    expect(screen.getByText(`160${summary.hoursSuffix}`)).toBeInTheDocument();
  });

  it("updates as the draft changes", () => {
    renderWithUser(panel());
    act(() => setQuoteDraft(AI_DRAFT));
    // 2 × $60 × 160 h × 0.25 months = $4,800, +30% for AI work.
    expect(screen.getByText("$6,240")).toBeInTheDocument();
    expect(screen.getByText("1 week")).toBeInTheDocument();
    expect(screen.getByText(`2 ${summary.members}`)).toBeInTheDocument();
    expect(screen.getByText("+30%")).toBeInTheDocument();
  });

  it("downloads the summary of the draft it shows", async () => {
    const { user } = renderWithUser(panel());
    act(() => setQuoteDraft(AI_DRAFT));
    await user.click(screen.getByRole("button", { name: summary.download }));
    expect(downloadSummary).toHaveBeenCalledWith(AI_DRAFT, quoteText.contactEmail);
  });

  it("renders the default estimate on the server, whatever the browser's draft", () => {
    setQuoteDraft(AI_DRAFT);
    const html = renderToString(panel());
    expect(html).toContain("$24,480");
    expect(html).not.toContain("$6,240");
  });
});
