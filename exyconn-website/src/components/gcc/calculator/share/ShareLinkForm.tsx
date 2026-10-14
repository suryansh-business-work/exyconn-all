import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { intlFormat } from "date-fns";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { Estimate } from "@exyconn/gcc-cost";
import { createShareLink, revokeShareLink } from "../../../../lib/gcc/api";
import { captchaAnswer } from "../../../forms/shared/fieldSchemas";
import { CaptchaInput } from "../dialogs/captcha/CaptchaInput";
import { useCaptcha } from "../dialogs/captcha/useCaptcha";
import { useCalculator } from "../state/CalculatorContext";
import { EXPIRY_DAYS, S } from "../strings/share";

const linkSchema = z.object({
  consent: z.boolean().refine(Boolean, S.consentError),
  expiresInDays: z.number().int().min(1).max(30),
  captcha: captchaAnswer("Answer the security question"),
});
type LinkValues = z.infer<typeof linkSchema>;

interface CreatedLink {
  token: string;
  revokeKey: string;
  expiresAt: string;
}

/** The link carries only an opaque token, in the URL fragment so it never reaches server logs. */
export const shareUrl = (token: string, revokeKey?: string) => {
  const params = new URLSearchParams({ share: token });
  if (revokeKey) {
    params.set("revoke", revokeKey);
  }
  return `${globalThis.location.origin}${globalThis.location.pathname}#${params.toString()}`;
};

/** Creates a read-only, expiring link after explicit consent; shows its revocation link. */
export function ShareLinkForm({
  estimate,
  active,
}: Readonly<{ estimate: Estimate; active: boolean }>) {
  const { locale } = useCalculator();
  const captcha = useCaptcha(active);
  const [created, setCreated] = useState<CreatedLink | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const { register, handleSubmit, formState, control } = useForm<LinkValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: { consent: false, expiresInDays: 7, captcha: "" },
  });
  const { errors, isSubmitting } = formState;

  const create = handleSubmit(async ({ expiresInDays, captcha: answer }) => {
    const result = await createShareLink({
      estimate,
      expiresInDays,
      captcha: { token: captcha.token, answer },
    });
    if (result.ok) {
      setCreated(result);
      const until = intlFormat(
        new Date(result.expiresAt),
        { dateStyle: "medium", timeStyle: "short" },
        { locale }
      );
      setMessage({ ok: true, text: S.created(until) });
    } else {
      setMessage({ ok: false, text: S.unavailable(result.message) });
    }
    await captcha.reload();
  });

  const revoke = async () => {
    if (!created) {
      return;
    }
    const result = await revokeShareLink(created.token, created.revokeKey);
    if (result.ok) {
      setCreated(null);
      setMessage({ ok: true, text: S.revoked });
    } else {
      setMessage({ ok: false, text: S.revokeFailed(result.message) });
    }
  };

  return (
    <fieldset className="gcc-group">
      <legend className="gcc-group__title">{S.linkTitle}</legend>
      <Stack spacing={2}>
        <p className="gcc-lines__note">{S.linkIntro}</p>
        {message && <Alert severity={message.ok ? "success" : "warning"}>{message.text}</Alert>}
        {created ? (
          <>
            <TextField
              label={S.link}
              value={shareUrl(created.token)}
              slotProps={{ htmlInput: { readOnly: true } }}
            />
            <TextField
              label={S.revokeLink}
              value={shareUrl(created.token, created.revokeKey)}
              helperText={S.revokeNote}
              slotProps={{ htmlInput: { readOnly: true } }}
            />
            <div className="gcc-row">
              <Button
                onClick={() => globalThis.navigator.clipboard?.writeText(shareUrl(created.token))}
              >
                {S.copyLink}
              </Button>
              <Button color="error" variant="outlined" onClick={revoke}>
                {S.revoke}
              </Button>
            </div>
          </>
        ) : (
          <form noValidate onSubmit={create} className="gcc-stack">
            <div>
              <FormControlLabel control={<Checkbox {...register("consent")} />} label={S.consent} />
              {errors.consent && <FormHelperText error>{errors.consent.message}</FormHelperText>}
            </div>
            <Controller
              control={control}
              name="expiresInDays"
              render={({ field }) => (
                <TextField
                  select
                  label={S.expiry}
                  value={field.value}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  onBlur={field.onBlur}
                >
                  {EXPIRY_DAYS.map((days) => (
                    <MenuItem key={days} value={days}>
                      {S.days(days)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <CaptchaInput
              captcha={captcha}
              registration={register("captcha")}
              error={errors.captcha?.message}
              onReload={captcha.reload}
            />
            <Button type="submit" variant="contained" disabled={isSubmitting || !captcha.token}>
              {isSubmitting ? S.creating : S.create}
            </Button>
          </form>
        )}
      </Stack>
    </fieldset>
  );
}
