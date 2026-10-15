import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import type { Estimate } from "@exyconn/gcc-cost";
import { emailEstimate } from "../../../../../lib/gcc/api";
import { UI } from "../../strings/ui";
import { CaptchaInput } from "../captcha/CaptchaInput";
import { useCaptcha } from "../captcha/useCaptcha";
import { EMAIL_DEFAULTS, emailSchema, type EmailValues } from "./email.schema";

const COPY = {
  title: "Email this estimate",
  intro:
    "We send a PDF of this estimate from Exyconn's mail server. The address and estimate are used only to send this email.",
  to: "Send to",
  note: "Note to include (optional)",
  confirm:
    "I confirm this estimate, including any company details in it, may be sent to this address.",
  send: "Send email",
  sending: "Sending…",
  sent: (to: string) =>
    `Sent to ${to}. If it does not arrive, check spam, or download the PDF instead.`,
  alternative: "Meanwhile you can download the PDF or JSON from Results.",
} as const;

type Outcome = { kind: "idle" } | { kind: "sent"; to: string } | { kind: "failed"; text: string };

/** Emails the estimate through the server; success is shown only when the server confirms it. */
export function EmailDialog({
  open,
  estimate,
  onClose,
}: Readonly<{ open: boolean; estimate: Estimate; onClose: () => void }>) {
  const titleId = useId();
  const captcha = useCaptcha(open);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });
  const { register, handleSubmit, reset, formState } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: EMAIL_DEFAULTS,
    mode: "onTouched",
  });
  const { errors, isSubmitting } = formState;

  const send = handleSubmit(async (values) => {
    const result = await emailEstimate({
      to: values.to,
      estimate,
      note: values.note,
      captcha: { token: captcha.token, answer: values.captcha },
    });
    if (result.ok) {
      setOutcome({ kind: "sent", to: result.sentTo });
      reset(EMAIL_DEFAULTS);
    } else {
      setOutcome({ kind: "failed", text: `${result.message} ${COPY.alternative}` });
    }
    await captcha.reload();
  });

  const close = () => {
    setOutcome({ kind: "idle" });
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} aria-labelledby={titleId} fullWidth maxWidth="sm">
      <form noValidate onSubmit={send}>
        <DialogTitle id={titleId}>{COPY.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <p>{COPY.intro}</p>
            {outcome.kind === "sent" && <Alert severity="success">{COPY.sent(outcome.to)}</Alert>}
            {outcome.kind === "failed" && <Alert severity="error">{outcome.text}</Alert>}
            <TextField
              {...register("to")}
              type="email"
              label={COPY.to}
              required
              autoComplete="email"
              error={Boolean(errors.to)}
              helperText={errors.to?.message}
            />
            <TextField
              {...register("note")}
              label={COPY.note}
              multiline
              minRows={2}
              error={Boolean(errors.note)}
              helperText={errors.note?.message}
            />
            <div>
              <FormControlLabel
                control={<Checkbox {...register("confirm")} />}
                label={COPY.confirm}
              />
              {errors.confirm && <FormHelperText error>{errors.confirm.message}</FormHelperText>}
            </div>
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
            {isSubmitting ? COPY.sending : COPY.send}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
