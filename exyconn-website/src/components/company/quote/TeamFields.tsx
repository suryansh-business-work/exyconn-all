import { useFieldArray, useFormContext } from "react-hook-form";
import { FormField } from "../../forms/shared";
import { CONTROL_CLASS } from "../../forms/legal/legal-form.styles";
import {
  QUOTE_LIMITS,
  ROLE_GROUPS,
  findRole,
  formatUsd,
  nextRole,
} from "../../../lib/company/quote";
import { useQuoteText } from "./quote-text";
import type { QuoteFormValues } from "./quote.types";

/** The team: one row per role with its head count and hourly rate; add and remove rows. */
export function TeamFields() {
  const text = useQuoteText().scope;
  const {
    control,
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<QuoteFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "team" });
  const team = watch("team");
  // trigger() on the field array files the array's own error under `root`; a full-form
  // resolver run with no rows mounted files it on `team` itself.
  const teamError = errors.team?.root?.message ?? errors.team?.message;

  const onRoleChange = (index: number, roleId: string) => {
    setValue(`team.${index}.rate`, findRole(roleId).rate, { shouldValidate: true });
  };

  const addRole = () => {
    const role = nextRole(getValues("team"));
    append({ roleId: role.id, count: 1, rate: role.rate, customLabel: "" });
  };

  return (
    <fieldset className="quote-fieldset">
      <legend className="quote-legend">{text.team}</legend>
      <ul className="quote-team">
        {fields.map((field, index) => {
          const lineErrors = errors.team?.[index];
          const roleId = team[index].roleId;
          const roleLabel = findRole(roleId).label;
          return (
            <li key={field.id} className="quote-team__row">
              <FormField id={`team-${field.id}-role`} label={text.role}>
                <select
                  id={`team-${field.id}-role`}
                  className={CONTROL_CLASS}
                  {...register(`team.${index}.roleId`, {
                    onChange: (event) => onRoleChange(index, event.target.value),
                  })}
                >
                  {ROLE_GROUPS.map((group) => (
                    <optgroup key={group.name} label={group.name}>
                      {group.roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {`${role.label} (${formatUsd(role.rate)}/hr)`}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </FormField>
              <FormField
                id={`team-${field.id}-count`}
                label={text.count}
                error={lineErrors?.count?.message}
              >
                <input
                  id={`team-${field.id}-count`}
                  type="number"
                  inputMode="numeric"
                  min={QUOTE_LIMITS.minCount}
                  max={QUOTE_LIMITS.maxCount}
                  aria-invalid={Boolean(lineErrors?.count)}
                  className={CONTROL_CLASS}
                  {...register(`team.${index}.count`, { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                id={`team-${field.id}-rate`}
                label={text.rate}
                error={lineErrors?.rate?.message}
              >
                <input
                  id={`team-${field.id}-rate`}
                  type="number"
                  inputMode="decimal"
                  min={QUOTE_LIMITS.minRate}
                  max={QUOTE_LIMITS.maxRate}
                  aria-invalid={Boolean(lineErrors?.rate)}
                  className={CONTROL_CLASS}
                  {...register(`team.${index}.rate`, { valueAsNumber: true })}
                />
              </FormField>
              <button
                type="button"
                className="quote-icon-button"
                onClick={() => remove(index)}
                disabled={fields.length <= 1}
                aria-label={text.removeRole.replace("{role}", roleLabel)}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
              {findRole(roleId).isCustom && (
                <div className="quote-team__custom">
                  <FormField
                    id={`team-${field.id}-name`}
                    label={text.customName}
                    error={lineErrors?.customLabel?.message}
                  >
                    <input
                      id={`team-${field.id}-name`}
                      type="text"
                      placeholder={text.customNamePlaceholder}
                      className={CONTROL_CLASS}
                      {...register(`team.${index}.customLabel`)}
                    />
                  </FormField>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {teamError && <p className="quote-error">{teamError}</p>}
      {fields.length < QUOTE_LIMITS.maxTeam && (
        <button
          type="button"
          className="inner-action inner-action--ghost quote-add"
          onClick={addRole}
        >
          {text.addRole}
        </button>
      )}
    </fieldset>
  );
}
