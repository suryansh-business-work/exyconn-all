import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CaptchaField,
  FormField,
  SubmitButton,
  SubmitStatusAlert,
  useCaptchaSubmit,
} from "../../forms/shared";
import {
  CAPTCHA_CLASS,
  CONTROL_CLASS,
  ROW_CLASS,
  SUBMIT_CLASS,
} from "../../forms/legal/legal-form.styles";
import { AGENTS, agentRequest, agentsText, selectedAgentNames } from "../../../lib/company/agents";
import { highlightStage } from "../../../scripts/stage3d/events";
import { AgentPicker } from "./AgentPicker";
import { SuiteList } from "./SuiteList";
import { ORDER_AGENTS_DEFAULTS, orderAgentsSchema } from "./order-agents.schema";
import type { OrderAgentsValues } from "./order-agents.types";
import "./order-agents.css";

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

/**
 * Build-your-suite (React Hook Form + Zod): pick agents, say who you are, answer the
 * security question. The request goes to /api/form-submit as a contact enquiry — the same
 * path and captcha as the contact form — and the result shows in the page.
 */
export function OrderAgentsForm() {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<OrderAgentsValues>({
    resolver: zodResolver(orderAgentsSchema),
    defaultValues: ORDER_AGENTS_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "contact",
    () => reset(),
    { successResetMs: 15000 }
  );
  const selected = watch("agentIds");
  const chosen = AGENTS.filter((agent) => selected.includes(agent.id));

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((agentId) => agentId !== id)
      : [...selected, id];
    setValue("agentIds", next, { shouldValidate: isSubmitted });
    highlightStage(next.length > 0 ? next.length : null);
  };

  const send = ({ captcha: answer, agentIds, ...contact }: OrderAgentsValues) =>
    submit(answer, agentRequest(contact, selectedAgentNames(agentIds)));

  return (
    <div className="agents-layout">
      <AgentPicker agents={AGENTS} selected={selected} onToggle={toggle} />
      <section className="inner-panel agents-suite legal-form" aria-labelledby="agents-suite">
        <SuiteList
          names={chosen}
          total={AGENTS.length}
          error={errors.agentIds?.message}
          onRemove={toggle}
        />
        <form aria-label={agentsText.submit} onSubmit={handleSubmit(send)}>
          <h3 className="stage-label inner-index">{agentsText.detailsTitle}</h3>
          <div className={ROW_CLASS}>
            {FIELDS.map((field) => (
              <FormField
                key={field.name}
                id={`agents-${field.name}`}
                label={agentsText[field.name]}
                marker={field.required ? "required" : "optional"}
                error={errors[field.name]?.message}
              >
                <input
                  id={`agents-${field.name}`}
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
            id="agents-notes"
            label={agentsText.notes}
            marker="optional"
            error={errors.notes?.message}
          >
            <textarea
              id="agents-notes"
              rows={3}
              aria-invalid={Boolean(errors.notes)}
              className={CONTROL_CLASS}
              {...register("notes")}
            />
          </FormField>
          <div className={CAPTCHA_CLASS}>
            <CaptchaField
              question={captcha.question}
              registration={register("captcha")}
              error={errors.captcha?.message}
              captchaError={captchaError}
              onRefresh={refreshCaptcha}
              accent="amber"
            />
          </div>
          <SubmitStatusAlert status={status} successMessage={agentsText.sent} />
          <SubmitButton
            isSubmitting={isSubmitting}
            className={SUBMIT_CLASS}
            label={agentsText.submit}
            busyLabel={agentsText.sending}
          />
        </form>
      </section>
    </div>
  );
}
