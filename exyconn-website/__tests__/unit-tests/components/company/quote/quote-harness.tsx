/**
 * Hosts one quote step the way QuoteForm does (React Hook Form + Zod, the quote's words in
 * context), with a "Check" button that validates the given fields as the form's Continue does.
 */
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  QUOTE_FORM_DEFAULTS,
  quoteFormSchema,
  type QuoteFormValues,
} from "../../../../../src/components/company/quote";
import { QuoteTextContext } from "../../../../../src/components/company/quote/quote-text";
import { quoteText } from "../company-fixtures";

export const CONTACT = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines",
  notes: "",
  captcha: "",
} as const;

interface QuoteHarnessProps {
  children: ReactNode;
  values?: Partial<QuoteFormValues>;
  /** What "Check" validates; every field when left out. */
  fields?: (keyof QuoteFormValues)[];
}

export function QuoteHarness({ children, values, fields }: Readonly<QuoteHarnessProps>) {
  const methods = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: { ...QUOTE_FORM_DEFAULTS, ...values },
    mode: "onTouched",
  });
  return (
    <QuoteTextContext value={quoteText}>
      <FormProvider {...methods}>
        {children}
        <button type="button" onClick={() => methods.trigger(fields)}>
          Check
        </button>
      </FormProvider>
    </QuoteTextContext>
  );
}
