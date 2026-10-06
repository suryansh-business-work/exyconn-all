import { useMemo } from "react";
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
import { agentRequest, selectedAgentNames, type Agent } from "../../../lib/company/agents";
import { highlightStage } from "../../../scripts/stage3d/events";
import { AgentPicker } from "./AgentPicker";
import { SuiteList } from "./SuiteList";
import { ORDER_AGENTS_DEFAULTS, orderAgentsSchema } from "./order-agents.schema";
import type { OrderAgentsText, OrderAgentsValues } from "./order-agents.types";
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
 * path and captcha as the contact form — and the result shows in the page. The agents and
 * every word are the CMS page's props.
 */
export function OrderAgentsForm({
  agents,
  text,
}: Readonly<{ agents: readonly Agent[]; text: OrderAgentsText }>) {
  const schema = useMemo(
    () =>
      orderAgentsSchema(
        agents.map((agent) => agent.id),
        text.messages
      ),
    [agents, text.messages]
  );
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<OrderAgentsValues>({
    resolver: zodResolver(schema),
    defaultValues: ORDER_AGENTS_DEFAULTS,
    mode: "onTouched",
  });
  const { captcha, captchaError, refreshCaptcha, status, submit } = useCaptchaSubmit(
    "contact",
    () => reset(),
    {
      incorrectAnswer: text.status.incorrect,
      loading: text.status.loading,
      loadFailed: text.status.loadFailed,
      successResetMs: 15000,
    }
  );
  const selected = watch("agentIds");
  const chosen = agents.filter((agent) => selected.includes(agent.id));

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((agentId) => agentId !== id)
      : [...selected, id];
    setValue("agentIds", next, { shouldValidate: isSubmitted });
    highlightStage(next.length > 0 ? next.length : null);
  };

  const send = ({ captcha: answer, agentIds, ...contact }: OrderAgentsValues) =>
    submit(answer, agentRequest(contact, selectedAgentNames(agentIds, agents)));

  return (
    <div className="agents-layout">
      <AgentPicker agents={agents} selected={selected} onToggle={toggle} text={text} />
      <section className="inner-panel agents-suite legal-form" aria-labelledby="agents-suite">
        <SuiteList
          names={chosen}
          total={agents.length}
          error={errors.agentIds?.message}
          onRemove={toggle}
          text={text}
        />
        <form aria-label={text.submit} onSubmit={handleSubmit(send)}>
          <h3 className="stage-label inner-index">{text.detailsTitle}</h3>
          <div className={ROW_CLASS}>
            {FIELDS.map((field) => (
              <FormField
                key={field.name}
                id={`agents-${field.name}`}
                label={text[field.name]}
                marker={field.required ? "required" : "optional"}
                optionalLabel={text.optional}
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
            label={text.notes}
            marker="optional"
            optionalLabel={text.optional}
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
              copy={text.captcha}
            />
          </div>
          <SubmitStatusAlert
            status={status}
            successMessage={text.sent}
            errorMessage={text.status.failed}
          />
          <SubmitButton
            isSubmitting={isSubmitting}
            className={SUBMIT_CLASS}
            label={text.submit}
            busyLabel={text.sending}
          />
        </form>
      </section>
    </div>
  );
}
