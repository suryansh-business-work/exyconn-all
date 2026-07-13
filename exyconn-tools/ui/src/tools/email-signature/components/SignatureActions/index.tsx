import React, { useState, useMemo } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { SignatureFormValues } from '../../types';
import { generateSignatureHTML } from '../../utils/generateSignature';
import { sendSignatureTestEmail } from '../../../../shared/services/api';
import CopyButtons from './CopyButtons';
import SecondaryActions from './SecondaryActions';
import TestEmailDialog from './TestEmailDialog';

interface SignatureActionsProps {
  values: SignatureFormValues;
  isValid: boolean;
  onReset: () => void;
}

const SignatureActions: React.FC<SignatureActionsProps> = ({ values, isValid: _isValid, onReset }) => {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [testEmailDialog, setTestEmailDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [copied, setCopied] = useState<'html' | 'text' | null>(null);
  const [emailMethod, setEmailMethod] = useState<'server' | 'client'>('server');
  const [isSending, setIsSending] = useState(false);

  const signatureHTML = useMemo(() => generateSignatureHTML(values), [values]);
  const hasContent = values.fullName.trim() !== '';

  const handleCopyHTML = async () => {
    try {
      await navigator.clipboard.writeText(signatureHTML);
      setCopied('html');
      setSnackbar({ open: true, message: 'HTML code copied to clipboard!', severity: 'success' });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setSnackbar({ open: true, message: 'Failed to copy. Please try again.', severity: 'error' });
    }
  };

  const handleCopyRichText = async () => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = signatureHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand('copy');
      selection?.removeAllRanges();
      document.body.removeChild(tempDiv);

      setCopied('text');
      setSnackbar({
        open: true,
        message: 'Signature copied! Paste directly into your email client.',
        severity: 'success',
      });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setSnackbar({ open: true, message: 'Failed to copy. Please try again.', severity: 'error' });
    }
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([signatureHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-signature-${values.fullName.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: 'HTML file downloaded!', severity: 'success' });
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setSnackbar({ open: true, message: 'Please enter a valid email address.', severity: 'error' });
      return;
    }

    if (emailMethod === 'server') {
      setIsSending(true);
      try {
        const result = await sendSignatureTestEmail(testEmail, signatureHTML, values.fullName);
        if (result.success) {
          setTestEmailDialog(false);
          setTestEmail('');
          setSnackbar({ open: true, message: 'Test email sent successfully! Check your inbox.', severity: 'success' });
        } else {
          setSnackbar({
            open: true,
            message: result.error || 'Failed to send email. Try the client method.',
            severity: 'error',
          });
        }
      } catch {
        setSnackbar({ open: true, message: 'Server error. Try the client method instead.', severity: 'error' });
      } finally {
        setIsSending(false);
      }
    } else {
      const subject = encodeURIComponent('Test Email Signature');
      const body = encodeURIComponent(
        `Hi,\n\nThis is a test email to preview my new email signature.\n\nBest regards,\n\n---\n[Note: Open in your email client to see the formatted signature. The HTML version has been copied to your clipboard.]\n`
      );
      navigator.clipboard.writeText(signatureHTML);
      window.location.href = `mailto:${testEmail}?subject=${subject}&body=${body}`;
      setTestEmailDialog(false);
      setSnackbar({
        open: true,
        message: 'HTML copied! Compose window opened. Paste your signature at the end of the email.',
        severity: 'info',
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all fields? This cannot be undone.')) {
      onReset();
      setSnackbar({ open: true, message: 'Form has been reset.', severity: 'info' });
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: 'stretch',
          justifyContent: 'space-between',
        }}
      >
        <CopyButtons
          hasContent={hasContent}
          copied={copied}
          onCopyRichText={handleCopyRichText}
          onCopyHTML={handleCopyHTML}
        />
        <SecondaryActions
          hasContent={hasContent}
          onDownload={handleDownloadHTML}
          onTestEmail={() => setTestEmailDialog(true)}
          onReset={handleReset}
        />
      </Box>

      <TestEmailDialog
        open={testEmailDialog}
        testEmail={testEmail}
        emailMethod={emailMethod}
        isSending={isSending}
        onClose={() => setTestEmailDialog(false)}
        onEmailChange={setTestEmail}
        onMethodChange={setEmailMethod}
        onSend={handleSendTestEmail}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SignatureActions;
