import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface NotificationSnackbarsProps {
  error: string | null;
  successMessage: string | null;
  onErrorClose: () => void;
  onSuccessClose: () => void;
}

const NotificationSnackbars: React.FC<NotificationSnackbarsProps> = ({
  error,
  successMessage,
  onErrorClose,
  onSuccessClose,
}) => {
  return (
    <>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={onErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={onErrorClose} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={onSuccessClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={onSuccessClose} severity="success" variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationSnackbars;
