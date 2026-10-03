import { useFormContext } from "react-hook-form";
import type { ChoiceOption, QuoteFormValues } from "./quote.types";

type ChoiceField = "projectTypeId" | "durationId" | "hoursId";

interface ChoiceCardsProps {
  name: ChoiceField;
  legend: string;
  options: readonly ChoiceOption[];
  /** Columns from 640px; phones always show two. */
  columns: 3 | 4;
}

/** A radio group drawn as cards: a real radio per option, so arrows and Space work. */
export function ChoiceCards({ name, legend, options, columns }: Readonly<ChoiceCardsProps>) {
  const { register } = useFormContext<QuoteFormValues>();
  return (
    <fieldset className="quote-fieldset">
      <legend className="quote-legend">{legend}</legend>
      <div className={`quote-choices quote-choices--${columns}`}>
        {options.map((option) => (
          <label key={option.id} className="quote-choice">
            <input
              type="radio"
              value={option.id}
              className="quote-choice__input"
              {...register(name)}
            />
            <span className="quote-choice__label">{option.label}</span>
            {option.detail && <span className="quote-choice__detail">{option.detail}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
