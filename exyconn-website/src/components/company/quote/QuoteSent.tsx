import type { RefObject } from "react";

interface QuoteSentProps {
  headingRef: RefObject<HTMLHeadingElement | null>;
  message: string;
}

/** What replaces the form once the estimate is sent; focus moves to its heading. */
export function QuoteSent({ headingRef, message }: Readonly<QuoteSentProps>) {
  return (
    <output className="quote-sent">
      <h2 ref={headingRef} tabIndex={-1} className="inner-h3">
        <i className="fa-solid fa-circle-check" aria-hidden="true"></i> {message}
      </h2>
    </output>
  );
}
