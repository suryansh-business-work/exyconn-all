import { useFormContext } from "react-hook-form";
import { FormField } from "../../forms/shared";
import { CONTROL_CLASS } from "../../forms/legal/legal-form.styles";
import { DURATION_PRESETS, HOURS_OPTIONS, QUOTE_LIMITS } from "../../../lib/company/quote";
import { useQuoteText } from "./quote-text";
import { ChoiceCards } from "./ChoiceCards";
import { TeamFields } from "./TeamFields";
import type { QuoteFormValues } from "./quote.types";

const DURATIONS = DURATION_PRESETS.map(({ id, label, description }) => ({
  id,
  label,
  detail: description,
}));

/** Step 2: the team, how long and how many hours a month. */
export function ScopeStep() {
  const text = useQuoteText().scope;
  const hours = HOURS_OPTIONS.map(({ id, label, hours: perMonth }) => ({
    id,
    label,
    detail: `${perMonth} ${text.hoursUnit}`,
  }));
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<QuoteFormValues>();
  const isCustom = watch("durationId") === "custom";
  return (
    <>
      <TeamFields />
      <ChoiceCards name="durationId" legend={text.duration} options={DURATIONS} columns={3} />
      {isCustom && (
        <FormField id="quote-months" label={text.customMonths} error={errors.customMonths?.message}>
          <input
            id="quote-months"
            type="number"
            inputMode="decimal"
            min={QUOTE_LIMITS.minMonths}
            max={QUOTE_LIMITS.maxMonths}
            step={0.25}
            aria-invalid={Boolean(errors.customMonths)}
            className={`${CONTROL_CLASS} quote-months`}
            {...register("customMonths", { valueAsNumber: true })}
          />
        </FormField>
      )}
      <ChoiceCards name="hoursId" legend={text.hours} options={hours} columns={3} />
    </>
  );
}
