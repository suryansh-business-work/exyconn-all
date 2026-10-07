// @vitest-environment jsdom
/** The quote form's words reach every step through context, and only inside QuoteForm. */
import { Component, type ReactNode } from "react";
import { render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  QuoteTextContext,
  useQuoteText,
} from "../../../../../src/components/company/quote/quote-text";
import { QuoteSent } from "../../../../../src/components/company/quote/QuoteSent";
import { quoteText } from "../company-fixtures";

interface BoundaryProps {
  children: ReactNode;
  onError: (error: Error) => void;
}

/** Catches what a child throws while rendering, as a page's error boundary would. */
class Boundary extends Component<Readonly<BoundaryProps>, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function ReadsText() {
  return <p>{useQuoteText().send}</p>;
}

function Provider({ children }: Readonly<{ children: ReactNode }>) {
  return <QuoteTextContext value={quoteText}>{children}</QuoteTextContext>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useQuoteText", () => {
  it("reads the words QuoteForm provides", () => {
    const { result } = renderHook(() => useQuoteText(), { wrapper: Provider });
    expect(result.current).toBe(quoteText);
  });

  it("refuses to run outside QuoteForm", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onError = vi.fn();
    render(
      <Boundary onError={onError}>
        <ReadsText />
      </Boundary>
    );
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "useQuoteText must be used inside QuoteForm." })
    );
  });
});

describe("QuoteSent", () => {
  it("announces the thank-you with a focusable heading", () => {
    const headingRef = { current: null as HTMLHeadingElement | null };
    const { getByRole } = render(<QuoteSent headingRef={headingRef} message={quoteText.sent} />);
    expect(getByRole("status")).toHaveTextContent(quoteText.sent);
    expect(headingRef.current).toBe(getByRole("heading", { name: quoteText.sent }));
    expect(headingRef.current?.tabIndex).toBe(-1);
  });
});
