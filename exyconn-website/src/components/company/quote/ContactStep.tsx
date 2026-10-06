import { useFormContext } from "react-hook-form";
import { FormField } from "../../forms/shared";
import { CONTROL_CLASS, ROW_CLASS } from "../../forms/legal/legal-form.styles";
import { useQuoteText } from "./quote-text";
import type { QuoteFormValues } from "./quote.types";

type TextField = "firstName" | "lastName" | "email" | "company";

const FIELDS: readonly {
  name: TextField;
  type: string;
  autoComplete: string;
  required: boolean;
}[] = [
  { name: "firstName", type: "text", autoComplete: "given-name", required: true },
  { name: "lastName", type: "text", autoComplete: "family-name", required: true },
  { name: "email", type: "email", autoComplete: "email", required: true },
  { name: "company", type: "text", autoComplete: "organization", required: false },
];

/** Step 3: who to reply to. */
export function ContactStep() {
  const text = useQuoteText().contact;
  const {
    register,
    formState: { errors },
  } = useFormContext<QuoteFormValues>();
  return (
    <>
      <div className={ROW_CLASS}>
        {FIELDS.map((field) => (
          <FormField
            key={field.name}
            id={`quote-${field.name}`}
            label={text[field.name]}
            marker={field.required ? "required" : "optional"}
            optionalLabel={text.optional}
            error={errors[field.name]?.message}
          >
            <input
              id={`quote-${field.name}`}
              type={field.type}
              autoComplete={field.autoComplete}
              aria-invalid={Boolean(errors[field.name])}
              className={CONTROL_CLASS}
              {...register(field.name)}
            />
          </FormField>
        ))}
      </div>
      <FormField
        id="quote-notes"
        label={text.notes}
        marker="optional"
        optionalLabel={text.optional}
        error={errors.notes?.message}
      >
        <textarea
          id="quote-notes"
          rows={4}
          aria-invalid={Boolean(errors.notes)}
          className={CONTROL_CLASS}
          {...register("notes")}
        />
      </FormField>
    </>
  );
}
