import { useId } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { strings } from "../../strings";

interface EndChatDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** "End this chat?" — the destructive step always asks first. */
export function EndChatDialog({ open, onCancel, onConfirm }: Readonly<EndChatDialogProps>) {
  const id = useId();
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-text`}
      maxWidth="xs"
    >
      <DialogTitle id={`${id}-title`}>{strings.endTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText id={`${id}-text`}>{strings.endConfirm}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} autoFocus>
          {strings.cancel}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {strings.endConfirmYes}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
