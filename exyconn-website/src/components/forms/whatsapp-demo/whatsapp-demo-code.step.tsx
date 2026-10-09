import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, SubmitButton, inputClassName } from "../shared";
import { DemoStepError, checkDemoCode } from "./demoApi";
import { demoCodeSchema } from "./whatsapp-demo.schema";
import type { DemoAccess, DemoCodeValues } from "./whatsapp-demo.types";

const SUBMIT_CLASS = "inner-action inner-action--primary w-full justify-center";

interface DemoCodeStepProps {
  email: string;
  onVerified: (access: DemoAccess) => void;
  /** Back to step one — to fix the address or send a new code. */
  onStartOver: () => void;
}

/** Step two: the six-digit code from the email opens the live demo. */
export function DemoCodeStep({ email, onVerified, onStartOver }: Readonly<DemoCodeStepProps>) {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DemoCodeValues>({
    resolver: zodResolver(demoCodeSchema),
    defaultValues: { code: "" },
    mode: "onTouched",
  });

  const onSubmit = async ({ code }: DemoCodeValues) => {
    setError("");
    try {
      onVerified(await checkDemoCode(email, code));
    } catch (err) {
      setError(
        err instanceof DemoStepError ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <form aria-label="Enter your demo code" onSubmit={handleSubmit(onSubmit)} noValidate>
      <output className="mb-5 block rounded-xl border border-green-muted bg-green-subtle p-4 text-sm text-green-fg-strong">
        Thank you! We emailed a six-digit code to <strong>{email}</strong>. It works once, for 10
        minutes.
      </output>
      <FormField
        id="demo-code"
        label="Code from the email"
        marker="required"
        error={errors.code?.message ?? error}
      >
        <input
          id="demo-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          aria-invalid={Boolean(errors.code) || Boolean(error)}
          className={`${inputClassName("blue", Boolean(errors.code) || Boolean(error))} text-center font-mono text-2xl tracking-[0.5em]`}
          {...register("code")}
        />
      </FormField>
      <div className="mt-6">
        <SubmitButton
          isSubmitting={isSubmitting}
          className={SUBMIT_CLASS}
          label="Open the live demo"
          busyLabel="Checking your code…"
        />
      </div>
      <button
        type="button"
        onClick={onStartOver}
        className="mt-4 text-sm text-fg-muted underline underline-offset-4 hover:text-fg"
      >
        Use a different email or send a new code
      </button>
    </form>
  );
}
