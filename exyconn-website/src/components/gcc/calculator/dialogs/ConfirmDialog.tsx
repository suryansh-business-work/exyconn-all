import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useId } from "react";
import { UI } from "../strings/ui";

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  /** Destructive actions get the error colour on their confirm button. */
  destructive?: boolean;
  onConfirm: () => void;
}

/** The calculator's confirmation for anything destructive (delete, reset, replace). */
export function ConfirmDialog({
  request,
  onClose,
}: Readonly<{ request: ConfirmRequest | null; onClose: () => void }>) {
  const titleId = useId();
  const textId = useId();
  return (
    <Dialog
      open={request !== null}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={textId}
    >
      <DialogTitle id={titleId}>{request?.title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={textId}>{request?.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{UI.confirm.cancel}</Button>
        <Button
          variant="contained"
          color={request?.destructive ? "error" : "primary"}
          onClick={() => {
            request?.onConfirm();
            onClose();
          }}
        >
          {request?.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
