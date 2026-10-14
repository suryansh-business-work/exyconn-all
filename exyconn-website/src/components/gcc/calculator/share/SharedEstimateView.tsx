import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { intlFormat } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import {
  buildReport,
  calculateEstimate,
  duplicateEstimate,
  type CalculatorPreset,
  type Estimate,
} from "@exyconn/gcc-cost";
import { readSharedEstimate, revokeShareLink } from "../../../../lib/gcc/api";
import { saveEstimate } from "../../../../lib/gcc/storage";
import type { Brand } from "../GccCalculator";
import { ReportBody } from "../results/ReportBody";
import { readerLocale } from "../state/CalculatorContext";
import { S } from "../strings/share";

type Load =
  | { kind: "loading" }
  | { kind: "ready"; estimate: Estimate; expiresAt: string }
  | { kind: "missing" }
  | { kind: "failed"; message: string };

const calculatorUrl = () => `${globalThis.location.origin}${globalThis.location.pathname}`;

/** Owner-only: shown when the link carries its revocation key. */
function RevokePanel({ token, revokeKey }: Readonly<{ token: string; revokeKey: string }>) {
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const revoke = async () => {
    const result = await revokeShareLink(token, revokeKey);
    setState(
      result.ok
        ? { ok: true, text: S.revoked }
        : { ok: false, text: S.revokeFailed(result.message) }
    );
  };
  return (
    <Alert
      severity="warning"
      action={state?.ok ? undefined : <Button onClick={revoke}>{S.revoke}</Button>}
    >
      <strong>{S.shared.revokeTitle}.</strong> {state?.text ?? S.shared.revokeIntro}
    </Alert>
  );
}

/**
 * A shared estimate, read-only: recalculated here from its inputs and shown as the report. The
 * reader can save their own copy to this browser; nothing they do changes the shared original.
 */
export function SharedEstimateView({
  token,
  brand,
}: Readonly<{ token: string; preset: CalculatorPreset; brand: Brand }>) {
  const locale = readerLocale();
  const revokeKey = useMemo(
    () => new URLSearchParams(globalThis.location.hash.slice(1)).get("revoke"),
    []
  );
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    readSharedEstimate(token)
      .then((result) => {
        if (result.ok) {
          setLoad({ kind: "ready", estimate: result.estimate, expiresAt: result.expiresAt });
        } else if (result.reason === "not-found") {
          setLoad({ kind: "missing" });
        } else {
          setLoad({ kind: "failed", message: result.message });
        }
      })
      .catch((error: unknown) => {
        console.error("GCC calculator: the shared estimate could not be loaded", error);
        setLoad({ kind: "failed", message: "" });
      });
  }, [token]);

  const report = useMemo(() => {
    if (load.kind !== "ready") {
      return null;
    }
    const generatedOn = intlFormat(new Date(), { dateStyle: "medium" }, { locale });
    return buildReport(load.estimate, calculateEstimate(load.estimate), { locale, generatedOn });
  }, [load, locale]);

  const saveCopy = (estimate: Estimate) => {
    const copy = duplicateEstimate(estimate, estimate.name, new Date().toISOString());
    if (saveEstimate(copy, null).ok) {
      globalThis.location.assign(calculatorUrl());
    } else {
      setSaveFailed(true);
    }
  };

  const open = (
    <Button href={calculatorUrl()} variant="outlined">
      {S.shared.openCalculator}
    </Button>
  );
  if (load.kind === "loading") {
    return (
      <div className="gcc-loading" role="status">
        <CircularProgress size={20} aria-hidden="true" />
        <span>{S.shared.loading}</span>
      </div>
    );
  }
  if (load.kind !== "ready" || !report) {
    const reason = load.kind === "failed" ? load.message : "";
    const text = load.kind === "missing" ? S.shared.missing : S.shared.failed(reason);
    return (
      <Stack spacing={2}>
        <Alert severity="warning">{text}</Alert>
        {open}
      </Stack>
    );
  }
  const expires = intlFormat(new Date(load.expiresAt), { dateStyle: "medium" }, { locale });
  return (
    <Stack spacing={2} className="gcc-shared">
      {revokeKey && <RevokePanel token={token} revokeKey={revokeKey} />}
      <Alert
        severity="info"
        action={<Button onClick={() => saveCopy(load.estimate)}>{S.shared.saveCopy}</Button>}
      >
        {S.shared.readOnly(expires)}
      </Alert>
      {saveFailed && <Alert severity="error">{S.shared.saveFailed}</Alert>}
      <article className="gcc-report">
        <ReportBody report={report} />
        <p className="gcc-lines__note">
          {brand.businessName} · {brand.websiteUrl}
        </p>
      </article>
      {open}
    </Stack>
  );
}
