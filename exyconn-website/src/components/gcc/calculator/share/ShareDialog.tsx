import ContentCopy from "@mui/icons-material/ContentCopy";
import IosShare from "@mui/icons-material/IosShare";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useId, useMemo, useState } from "react";
import { reportText, toExportFile, type Estimate } from "@exyconn/gcc-cost";
import { fileStem, saveText } from "../../../../lib/gcc/download";
import { useReport } from "../results/useReport";
import { useCalculator } from "../state/CalculatorContext";
import { S } from "../strings/share";
import { UI } from "../strings/ui";
import { ShareLinkForm } from "./ShareLinkForm";

/**
 * The ways to pass an estimate on: the device's share sheet and the clipboard (summary text),
 * the JSON file, and — only with consent — a read-only link stored on the server.
 */
export function ShareDialog({
  open,
  estimate,
  onClose,
}: Readonly<{ open: boolean; estimate: Estimate; onClose: () => void }>) {
  const { live, brand } = useCalculator();
  const report = useReport();
  const titleId = useId();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const summary = useMemo(
    () =>
      `${reportText(report(estimate, live.outcomes))}\n\n${brand.businessName} · ${brand.websiteUrl}`,
    [report, estimate, live.outcomes, brand]
  );
  const canShare = typeof globalThis.navigator?.share === "function";

  const nativeShare = async () => {
    try {
      await globalThis.navigator.share({ title: estimate.name, text: summary });
    } catch (error) {
      // Closing the share sheet rejects with AbortError: not a failure worth showing.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("GCC calculator: native share failed", error);
      }
    }
  };

  const copy = async () => {
    try {
      await globalThis.navigator.clipboard.writeText(summary);
      setStatus({ ok: true, text: S.copied });
    } catch (error) {
      console.error("GCC calculator: clipboard write failed", error);
      setStatus({ ok: false, text: S.copyFailed });
    }
  };

  const downloadJson = () =>
    saveText(
      JSON.stringify(toExportFile(estimate, new Date().toISOString()), null, 2),
      `${fileStem(estimate.name)}.json`,
      "application/json"
    );

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="md">
      <DialogTitle id={titleId}>{S.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <div className="gcc-row">
            {canShare && (
              <Button startIcon={<IosShare />} variant="contained" onClick={nativeShare}>
                {S.native}
              </Button>
            )}
            <Button startIcon={<ContentCopy />} variant="outlined" onClick={copy}>
              {S.copy}
            </Button>
            <Button variant="outlined" onClick={downloadJson}>
              {S.json}
            </Button>
          </div>
          <p className="gcc-lines__note">{S.jsonNote}</p>
          {status && <Alert severity={status.ok ? "success" : "warning"}>{status.text}</Alert>}
          <TextField
            label={S.copy}
            value={summary}
            multiline
            minRows={4}
            maxRows={10}
            slotProps={{ htmlInput: { readOnly: true } }}
          />
          <ShareLinkForm estimate={estimate} active={open} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{UI.common.close}</Button>
      </DialogActions>
    </Dialog>
  );
}
