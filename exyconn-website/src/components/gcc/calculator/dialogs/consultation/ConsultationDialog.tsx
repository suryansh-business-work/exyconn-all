import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { reportText } from "@exyconn/gcc-cost";
import { postFormSubmission } from "../../../../forms/shared/postFormSubmission";
import { useReport } from "../../results/useReport";
import { useCalculator } from "../../state/CalculatorContext";
import { UI } from "../../strings/ui";
import { CaptchaInput } from "../captcha/CaptchaInput";
import { useCaptcha } from "../captcha/useCaptcha";
import {
  CONSULTATION_DEFAULTS,
  consultationSchema,
  type ConsultationValues,
} from "./consultation.schema";

const COPY = {
  title: "Request an Exyconn consultation",
  intro:
    "Tell us how to reach you and we'll review your GCC plan with you. The calculator works without this — nothing is sent unless you submit.",
  name: "Your name",
  email: "Work email",
  company: "Company",
  notes: "What would you like to discuss? (optional)",
  includeSummary: "Include a summary of this estimate's figures with my request",
  marketing: "Also send me Exyconn news and insights (optional; unsubscribe any time)",
  privacy:
    "We use these details to respond to your request and keep them in our CRM. See our privacy policy.",
  submit: "Send request",
  sending: "Sending…",
  sent: "Thank you — your request has reached our team. We'll reply by email.",
  failed:
    "Your request could not be sent right now. Please try again shortly, or contact us through the Contact page.",
  wrongAnswer: "That answer was not right. Here is a new question.",
} as const;

type Outcome = "idle" | "sent" | "failed";

/** Sends a consultation request to the website inbox, which files it as a CRM lead. */
export function ConsultationDialog({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const { live } = useCalculator();
  const report = useReport();
  const titleId = useId();
  const captcha = useCaptcha(open);
  const [outcome, setOutcome] = useState<Outcome>("idle");
  const { register, handleSubmit, reset, setError, formState } = useForm<ConsultationValues>({
    resolver: zodResolver(consultationSchema),
    defaultValues: CONSULTATION_DEFAULTS,
    mode: "onTouched",
  });
  const { errors, isSubmitting } = formState;

  const send = handleSubmit(
    async ({ captcha: answer, includeSummary, marketingConsent, ...fields }) => {
      const summary =
        includeSummary && live.estimate
          ? reportText(report(live.estimate, live.outcomes, "code"))
          : "";
      try {
        const result = await postFormSubmission(
          "gcc-consultation",
          {
            ...fields,
            marketingConsent: marketingConsent ? "yes" : "no",
            estimateSummary: summary,
          },
          { token: captcha.token, answer }
        );
        if (result === "captcha") {
          setError("captcha", { message: COPY.wrongAnswer });
        } else {
          setOutcome("sent");
          reset(CONSULTATION_DEFAULTS);
        }
      } catch (error) {
        console.error("GCC calculator: the consultation request could not be sent", error);
        setOutcome("failed");
      }
      await captcha.reload();
    }
  );

  const close = () => {
    setOutcome("idle");
    onClose();
  };
  const text = (key: "name" | "email" | "company") => ({
    error: Boolean(errors[key]),
    helperText: errors[key]?.message,
  });

  return (
    <Dialog open={open} onClose={close} aria-labelledby={titleId} fullWidth maxWidth="sm">
      <form noValidate onSubmit={send}>
        <DialogTitle id={titleId}>{COPY.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <p>{COPY.intro}</p>
            {outcome === "sent" && <Alert severity="success">{COPY.sent}</Alert>}
            {outcome === "failed" && <Alert severity="error">{COPY.failed}</Alert>}
            <TextField
              {...register("name")}
              label={COPY.name}
              required
              autoComplete="name"
              {...text("name")}
            />
            <TextField
              {...register("email")}
              type="email"
              label={COPY.email}
              required
              autoComplete="email"
              {...text("email")}
            />
            <TextField
              {...register("company")}
              label={COPY.company}
              required
              autoComplete="organization"
              {...text("company")}
            />
            <TextField
              {...register("notes")}
              label={COPY.notes}
              multiline
              minRows={3}
              error={Boolean(errors.notes)}
              helperText={errors.notes?.message}
            />
            <FormControlLabel
              control={<Checkbox {...register("includeSummary")} />}
              label={COPY.includeSummary}
            />
            <FormControlLabel
              control={<Checkbox {...register("marketingConsent")} />}
              label={COPY.marketing}
            />
            <p className="gcc-lines__note">{COPY.privacy}</p>
            <CaptchaInput
              captcha={captcha}
              registration={register("captcha")}
              error={errors.captcha?.message}
              onReload={captcha.reload}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>{UI.common.close}</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || !captcha.token}>
            {isSubmitting ? COPY.sending : COPY.submit}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
