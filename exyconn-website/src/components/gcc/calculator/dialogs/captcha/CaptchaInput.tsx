import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { CaptchaState } from "./useCaptcha";

const COPY = {
  label: (question: string) => `Security question: ${question}`,
  loading: "Loading the security question…",
  failed: "The security question could not be loaded. Try again.",
  reload: "New security question",
} as const;

/** The security answer field, with its question as the label and a button for a new one. */
export function CaptchaInput({
  captcha,
  registration,
  error,
  onReload,
}: Readonly<{
  captcha: CaptchaState;
  registration: UseFormRegisterReturn;
  error?: string;
  onReload: () => void;
}>) {
  const hint = captcha.failed ? COPY.failed : undefined;
  return (
    <TextField
      {...registration}
      label={captcha.question ? COPY.label(captcha.question) : COPY.loading}
      required
      autoComplete="off"
      error={Boolean(error) || captcha.failed}
      helperText={error ?? hint}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label={COPY.reload} onClick={onReload}>
                <RefreshOutlined />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
