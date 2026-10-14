import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import SyncOutlined from "@mui/icons-material/SyncOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { intlFormat } from "date-fns";
import { useCalculator } from "../state/CalculatorContext";
import type { SaveState } from "../state/useEstimateStore";
import { UI } from "../strings/ui";

function timeOf(iso: string, locale: string): string {
  return intlFormat(new Date(iso), { timeStyle: "short" }, { locale });
}

function statusText(state: SaveState, locale: string): string {
  switch (state.kind) {
    case "pending":
      return UI.save.pending;
    case "saved":
      return UI.save.saved(timeOf(state.at, locale));
    case "invalid":
      return UI.save.invalid(state.count);
    case "error":
      return UI.save[state.reason];
    case "conflict":
      return UI.save.conflict;
    default:
      return UI.save.idle;
  }
}

function StatusIcon({ state }: Readonly<{ state: SaveState }>) {
  if (state.kind === "pending") {
    return <SyncOutlined fontSize="small" aria-hidden="true" />;
  }
  if (state.kind === "error" || state.kind === "conflict") {
    return <ErrorOutlined fontSize="small" aria-hidden="true" />;
  }
  if (state.kind === "invalid") {
    return <WarningAmberOutlined fontSize="small" aria-hidden="true" />;
  }
  return <CheckCircleOutlined fontSize="small" aria-hidden="true" />;
}

/** The persistent save indicator, plus the choice to make when another tab changed the estimate. */
export function SaveStatus() {
  const { store, locale, live } = useCalculator();
  const state = store.saveState;
  const mine = live.valid ? live.estimate : null;
  return (
    <Stack spacing={1}>
      <p className={`gcc-save gcc-save--${state.kind}`} role="status" aria-live="polite">
        <StatusIcon state={state} />
        <span>{statusText(state, locale)}</span>
      </p>
      {state.kind === "conflict" && (
        <Alert
          severity="warning"
          action={
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={store.keepTheirs}>
                {UI.save.keepTheirs}
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={!mine}
                onClick={() => {
                  if (mine) {
                    store.keepMine(mine);
                  }
                }}
              >
                {UI.save.keepMine}
              </Button>
            </Stack>
          }
        >
          {UI.save.conflict}
        </Alert>
      )}
    </Stack>
  );
}
