import { useFormContext } from "react-hook-form";
import { FormField } from "../../forms/shared";
import { CONTROL_CLASS } from "../../forms/legal/legal-form.styles";
import { PROJECT_TYPES } from "../../../lib/company/quote";
import { useQuoteText } from "./quote-text";
import { ChoiceCards } from "./ChoiceCards";
import type { QuoteFormValues } from "./quote.types";

const OPTIONS = PROJECT_TYPES.map(({ id, label, description }) => ({
  id,
  label,
  detail: description,
}));

/** Step 1: what kind of project, and a description when none of the types fits. */
export function ServiceStep() {
  const text = useQuoteText();
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<QuoteFormValues>();
  const isOther = watch("projectTypeId") === "other";
  return (
    <>
      <ChoiceCards
        name="projectTypeId"
        legend={text.service.legend}
        options={OPTIONS}
        columns={4}
      />
      {isOther && (
        <FormField
          id="quote-description"
          label={text.service.describe}
          marker="optional"
          error={errors.description?.message}
        >
          <textarea
            id="quote-description"
            rows={3}
            placeholder={text.service.describePlaceholder}
            aria-invalid={Boolean(errors.description)}
            className={CONTROL_CLASS}
            {...register("description")}
          />
        </FormField>
      )}
    </>
  );
}
