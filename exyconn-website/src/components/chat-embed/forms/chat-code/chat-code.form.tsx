import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCountdown } from "../../hooks/useCountdown";
import { strings } from "../../strings";
import {
  CHAT_CODE_DEFAULTS,
  chatCodeSchema,
  RESEND_AFTER_SECONDS,
  type ChatCodeValues,
} from "./chat-code.types";

interface ChatCodeFormProps {
  email: string;
  /** When the last code was sent (ms since the epoch); resending waits 30 s from it. */
  codeSentAt: number;
  busy: boolean;
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}

/** The 6-digit code from the email, with resend (after 30 s) and change email. */
export function ChatCodeForm(props: Readonly<ChatCodeFormProps>) {
  const { email, codeSentAt, busy, onVerify, onResend, onChangeEmail } = props;
  const id = useId();
  const resendAt = new Date(codeSentAt + RESEND_AFTER_SECONDS * 1000).toISOString();
  const wait = useCountdown(resendAt) ?? 0;
  const { control, handleSubmit } = useForm<ChatCodeValues>({
    resolver: zodResolver(chatCodeSchema),
    defaultValues: CHAT_CODE_DEFAULTS,
    mode: "onTouched",
  });

  return (
    <Stack
      component="form"
      noValidate
      aria-labelledby={`${id}-title`}
      onSubmit={handleSubmit((values) => onVerify(values.code))}
      spacing={2}
    >
      <div>
        <Typography id={`${id}-title`} component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
          {strings.codeTitle}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {strings.codeSentTo(email)}
        </Typography>
      </div>
      <Controller
        name="code"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            onChange={(event) => field.onChange(event.target.value.replaceAll(" ", ""))}
            id={`${id}-code`}
            label={strings.code}
            required
            autoFocus
            autoComplete="one-time-code"
            error={fieldState.invalid}
            helperText={fieldState.error?.message ?? strings.codeHint}
            fullWidth
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                maxLength: 6,
                style: { letterSpacing: "0.5em", fontSize: "1.25rem", textAlign: "center" },
              },
            }}
          />
        )}
      />
      <Button type="submit" variant="contained" size="large" loading={busy}>
        {strings.verify}
      </Button>
      <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
        <Button onClick={onChangeEmail} size="small">
          {strings.changeEmail}
        </Button>
        <Button onClick={onResend} size="small" disabled={wait > 0 || busy}>
          {wait > 0 ? strings.resendIn(wait) : strings.resend}
        </Button>
      </Stack>
    </Stack>
  );
}
