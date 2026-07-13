import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { ResetDialogProps } from './types';

const ResetDialog: React.FC<ResetDialogProps> = ({ open, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle sx={{ pb: 1 }}>⚠️ Reset Settings?</DialogTitle>
    <DialogContent>
      <DialogContentText variant="body2">
        You have custom changes applied to some sizes. Resetting will override all settings to default values.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} size="small">
        Cancel
      </Button>
      <Button onClick={onConfirm} color="warning" variant="contained" size="small">
        Reset Anyway
      </Button>
    </DialogActions>
  </Dialog>
);

export default ResetDialog;
