import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import { strings } from "../../strings";
import type { Identity } from "../../types";
import { chatSignInSchema, type ChatSignInValues } from "./chat-sign-in.types";

interface ChatSignInFormProps {
  defaultValues: Readonly<Identity>;
  busy: boolean;
  onSubmit: (identity: Identity) => void;
}

type FieldName = keyof ChatSignInValues;

const FIELDS: ReadonlyArray<{
  name: FieldName;
  label: string;
  hint: string;
  type: string;
  autoComplete: string;
  inputMode: "text" | "email" | "tel";
  required: boolean;
}> = [
  {
    name: "name",
    label: strings.name,
    hint: strings.nameHint,
    type: "text",
    autoComplete: "name",
    inputMode: "text",
    required: true,
  },
  {
    name: "email",
    label: strings.email,
    hint: strings.emailHint,
    type: "email",
    autoComplete: "email",
    inputMode: "email",
    required: true,
  },
  {
    name: "phone",
    label: strings.phone,
    hint: strings.phoneHint,
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
    required: false,
  },
];

/** Who the visitor is: name, email (proved by a code) and an optional phone. */
export function ChatSignInForm({ defaultValues, busy, onSubmit }: Readonly<ChatSignInFormProps>) {
  const id = useId();
  const { control, handleSubmit } = useForm<ChatSignInValues>({
    resolver: zodResolver(chatSignInSchema),
    defaultValues: { ...defaultValues },
    mode: "onTouched",
  });

  return (
    <Stack
      component="form"
      noValidate
      aria-labelledby={`${id}-title`}
      onSubmit={handleSubmit((values) => onSubmit({ ...values, phone: values.phone.trim() }))}
      spacing={2}
    >
      <div>
        <Typography id={`${id}-title`} component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
          {strings.signInTitle}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {strings.signInIntro}
        </Typography>
      </div>
      {FIELDS.map((field) => (
        <Controller
          key={field.name}
          name={field.name}
          control={control}
          render={({ field: input, fieldState }) => (
            <TextField
              {...input}
              id={`${id}-${field.name}`}
              label={field.label}
              type={field.type}
              required={field.required}
              autoComplete={field.autoComplete}
              error={fieldState.invalid}
              helperText={fieldState.error?.message ?? field.hint}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { inputMode: field.inputMode, maxLength: 254 } }}
            />
          )}
        />
      ))}
      <Button
        type="submit"
        variant="contained"
        size="large"
        loading={busy}
        startIcon={<MarkEmailReadRoundedIcon />}
      >
        {strings.requestCode}
      </Button>
      <Link
        href="/privacy-policy"
        target="_blank"
        rel="noopener"
        variant="body2"
        sx={{ alignSelf: "center" }}
      >
        {strings.privacy}
      </Link>
    </Stack>
  );
}
