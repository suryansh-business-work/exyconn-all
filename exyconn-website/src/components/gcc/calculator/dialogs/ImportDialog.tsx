import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import { intlFormat } from "date-fns";
import { useId, useState } from "react";
import { useFormContext } from "react-hook-form";
import { LIMITS, parseEstimateFile, previewImport, type Estimate } from "@exyconn/gcc-cost";
import { useCalculator } from "../state/CalculatorContext";
import { UI } from "../strings/ui";

const COPY = {
  title: "Import an estimate",
  intro:
    "Choose a JSON file exported from this calculator. It is checked and recalculated here; totals in the file are never trusted.",
  choose: "Choose JSON file",
  preview: (name: string, date: string, currency: string, scenarios: number, items: number) =>
    `“${name}”, last changed ${date}, reported in ${currency}: ${scenarios} scenario(s), ${items} cost item(s).`,
  asNew: "Create as new estimate",
  replace: "Replace current estimate",
  confirmReplace:
    "Replace the open estimate with this file? A backup of the current version is kept in this browser.",
  confirmAgain: "Yes, replace it",
  tooLarge: `The file is larger than ${LIMITS.payloadBytes / 1_000_000} MB.`,
  unreadable: "The file could not be read.",
} as const;

/** Validates a JSON export, previews it, then adds it as a new estimate or replaces the open one. */
export function ImportDialog({ open, onClose }: Readonly<{ open: boolean; onClose: () => void }>) {
  const { store, locale } = useCalculator();
  const { getValues } = useFormContext<Estimate>();
  const titleId = useId();
  const inputId = useId();
  const [incoming, setIncoming] = useState<Estimate | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  const close = () => {
    setIncoming(null);
    setErrors([]);
    setConfirming(false);
    onClose();
  };

  const read = async (file: File | undefined) => {
    setIncoming(null);
    setConfirming(false);
    if (!file) {
      return;
    }
    if (file.size > LIMITS.payloadBytes) {
      setErrors([COPY.tooLarge]);
      return;
    }
    try {
      const result = parseEstimateFile(await file.text());
      if (result.ok) {
        setErrors([]);
        setIncoming(result.file.estimate);
      } else {
        setErrors([result.message, ...(result.reason === "invalid" ? result.issues : [])]);
      }
    } catch (error) {
      console.error("GCC calculator: the import file could not be read", error);
      setErrors([COPY.unreadable]);
    }
  };

  const preview = incoming ? previewImport(incoming) : null;
  const date = preview
    ? intlFormat(new Date(preview.updatedAt), { dateStyle: "medium" }, { locale })
    : "";
  return (
    <Dialog open={open} onClose={close} aria-labelledby={titleId} fullWidth maxWidth="sm">
      <DialogTitle id={titleId}>{COPY.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <p>{COPY.intro}</p>
          <div>
            <input
              id={inputId}
              className="gcc-visually-hidden"
              type="file"
              accept="application/json,.json"
              onChange={(event) => read(event.target.files?.[0])}
            />
            <Button
              component="label"
              htmlFor={inputId}
              variant="outlined"
              startIcon={<UploadFileOutlined />}
            >
              {COPY.choose}
            </Button>
          </div>
          {errors.length > 0 && (
            <Alert severity="error">
              <ul className="gcc-list">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
          {preview && (
            <Alert severity="info">
              {COPY.preview(
                preview.name,
                date,
                preview.reportingCurrency,
                preview.scenarioCount,
                preview.itemCount
              )}
            </Alert>
          )}
          {confirming && <Alert severity="warning">{COPY.confirmReplace}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>{UI.confirm.cancel}</Button>
        {incoming && confirming && (
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              store.replaceActive(getValues(), incoming);
              close();
            }}
          >
            {COPY.confirmAgain}
          </Button>
        )}
        {incoming && !confirming && (
          <>
            <Button onClick={() => setConfirming(true)}>{COPY.replace}</Button>
            <Button
              variant="contained"
              onClick={() => {
                store.importAsNew(incoming);
                close();
              }}
            >
              {COPY.asNew}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
