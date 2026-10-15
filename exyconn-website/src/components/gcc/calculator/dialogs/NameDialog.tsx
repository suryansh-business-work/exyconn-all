import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UI } from "../strings/ui";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(120, "Use 120 characters or fewer"),
});
type NameValues = z.infer<typeof nameSchema>;

export interface NameRequest {
  title: string;
  label: string;
  initial: string;
  submitLabel: string;
  maxLength?: number;
  onSubmit: (name: string) => void;
}

/** Asks for a name (new, renamed or duplicated estimate or scenario). */
export function NameDialog({
  request,
  onClose,
}: Readonly<{ request: NameRequest | null; onClose: () => void }>) {
  const titleId = useId();
  const { register, handleSubmit, reset, formState } = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: "" },
  });
  useEffect(() => {
    reset({ name: request?.initial ?? "" });
  }, [request, reset]);
  const submit = handleSubmit(({ name }) => {
    request?.onSubmit(name.slice(0, request.maxLength ?? 120));
    onClose();
  });
  return (
    <Dialog
      open={request !== null}
      onClose={onClose}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="xs"
    >
      <form noValidate onSubmit={submit}>
        <DialogTitle id={titleId}>{request?.title}</DialogTitle>
        <DialogContent>
          <TextField
            {...register("name")}
            autoFocus
            margin="dense"
            label={request?.label}
            error={Boolean(formState.errors.name)}
            helperText={formState.errors.name?.message}
            slotProps={{ htmlInput: { maxLength: request?.maxLength ?? 120 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{UI.confirm.cancel}</Button>
          <Button type="submit" variant="contained">
            {request?.submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
