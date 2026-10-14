import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  duplicateScenario,
  estimateCsv,
  LIMITS,
  toExportFile,
  type Estimate,
} from "@exyconn/gcc-cost";
import { fileStem, saveText } from "../../../../lib/gcc/download";
import { downloadPdf, pdfBrand } from "../../../../lib/gcc/pdf";
import { ConsultationDialog } from "../dialogs/consultation";
import { EmailDialog } from "../dialogs/email";
import { ImportDialog } from "../dialogs/ImportDialog";
import { ShareDialog } from "../share/ShareDialog";
import { useCalculator } from "../state/CalculatorContext";
import { X } from "../strings/actions";
import { UI } from "../strings/ui";
import { PrintReport } from "./PrintReport";
import { useReport } from "./useReport";

type Dialog = "import" | "share" | "email" | "consult" | null;
type Notice = { severity: "success" | "error"; text: string } | null;

/** Every way out of the calculator: files, print, import, share, email and a consultation. */
export function ExportActions() {
  const { live, store, brand } = useCalculator();
  const { getValues, setValue } = useFormContext<Estimate>();
  const report = useReport();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const estimate = live.valid ? live.estimate : null;

  const exportFile = (kind: "csv" | "json") => {
    if (!estimate) {
      return;
    }
    const stem = fileStem(estimate.name);
    if (kind === "csv") {
      saveText(estimateCsv(estimate, live.outcomes), `${stem}.csv`, "text/csv;charset=utf-8");
    } else {
      const file = toExportFile(estimate, new Date().toISOString());
      saveText(JSON.stringify(file, null, 2), `${stem}.json`, "application/json");
    }
    setNotice({ severity: "success", text: X.done[kind] });
  };

  const pdf = async () => {
    if (!estimate) {
      return;
    }
    setBusy(true);
    try {
      await downloadPdf(
        report(estimate, live.outcomes, "code"),
        pdfBrand(brand.businessName, brand.websiteUrl)
      );
      setNotice({ severity: "success", text: X.done.pdf });
    } catch (error) {
      console.error("GCC calculator: PDF generation failed", error);
      setNotice({ severity: "error", text: X.pdfFailed });
    } finally {
      setBusy(false);
    }
  };

  const saveScenario = () => {
    const scenarios = getValues("scenarios");
    const current = scenarios.find((scenario) => scenario.id === getValues("activeScenarioId"));
    if (current && scenarios.length < LIMITS.scenarios) {
      const copy = duplicateScenario(current, `${current.name}${UI.scenarios.copySuffix}`);
      setValue("scenarios", [...scenarios, copy], { shouldDirty: true });
      setValue("activeScenarioId", copy.id, { shouldDirty: true });
    }
  };

  const disabled = !estimate;
  return (
    <section className="gcc-panel gcc-exports" aria-labelledby="gcc-exports-title">
      <h3 id="gcc-exports-title" className="gcc-panel__title">
        {X.title}
      </h3>
      {disabled && <Alert severity="warning">{X.invalid}</Alert>}
      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)} role="status">
          {notice.text}
        </Alert>
      )}
      <div className="gcc-exports__groups">
        <div role="group" aria-label={X.download}>
          <Button variant="contained" disabled={disabled || busy} onClick={pdf}>
            {busy ? X.pdfBusy : X.pdf}
          </Button>
          <Button variant="outlined" disabled={disabled} onClick={() => exportFile("csv")}>
            {X.csv}
          </Button>
          <Button variant="outlined" disabled={disabled} onClick={() => exportFile("json")}>
            {X.json}
          </Button>
          <Button variant="outlined" disabled={disabled} onClick={() => globalThis.print()}>
            {X.print}
          </Button>
        </div>
        <div role="group" aria-label={X.share}>
          <Button variant="outlined" onClick={() => setDialog("import")}>
            {X.importJson}
          </Button>
          <Button variant="outlined" disabled={disabled} onClick={() => setDialog("share")}>
            {X.shareButton}
          </Button>
          <Button variant="outlined" disabled={disabled} onClick={() => setDialog("email")}>
            {X.email}
          </Button>
        </div>
        <div role="group" aria-label={X.plan}>
          <Button
            variant="outlined"
            disabled={disabled}
            onClick={() =>
              estimate && store.duplicate(estimate, `${estimate.name}${UI.estimates.copySuffix}`)
            }
          >
            {X.duplicate}
          </Button>
          <Button variant="outlined" onClick={saveScenario}>
            {X.saveScenario}
          </Button>
          <Button variant="contained" color="secondary" onClick={() => setDialog("consult")}>
            {X.consult}
          </Button>
        </div>
      </div>
      {estimate && <PrintReport report={report(estimate, live.outcomes)} />}
      <ImportDialog open={dialog === "import"} onClose={() => setDialog(null)} />
      {estimate && (
        <ShareDialog
          open={dialog === "share"}
          estimate={estimate}
          onClose={() => setDialog(null)}
        />
      )}
      {estimate && (
        <EmailDialog
          open={dialog === "email"}
          estimate={estimate}
          onClose={() => setDialog(null)}
        />
      )}
      <ConsultationDialog open={dialog === "consult"} onClose={() => setDialog(null)} />
    </section>
  );
}
