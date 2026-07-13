import React from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { MailOutline, Send } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface EmailFormProps {
  onSubmit: (email: string, intent: string, tone: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  email: Yup.string().required('Email is required').min(10, 'Email must be at least 10 characters'),
  intent: Yup.string().required('Intent is required'),
  tone: Yup.string().required('Tone is required'),
});

const intents = ['Accept', 'Decline', 'Follow-up', 'Clarify', 'Thank', 'Apologize', 'Negotiate', 'Request'];
const tones = ['Professional', 'Friendly', 'Formal', 'Concise', 'Detailed'];

const EmailReplyForm: React.FC<EmailFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { email: '', intent: 'Follow-up', tone: 'Professional' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.email, values.intent, values.tone),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <MailOutline color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Generate Email Reply
        </Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="email"
          label="Original Email"
          placeholder="Paste the email you want to reply to..."
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          multiline
          rows={5}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Intent</InputLabel>
            <Select name="intent" value={formik.values.intent} onChange={formik.handleChange} label="Intent">
              {intents.map((intent) => (
                <MenuItem key={intent} value={intent}>
                  {intent}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Tone</InputLabel>
            <Select name="tone" value={formik.values.tone} onChange={formik.handleChange} label="Tone">
              {tones.map((tone) => (
                <MenuItem key={tone} value={tone}>
                  {tone}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading || !formik.values.email}
          startIcon={isLoading ? <CircularProgress size={18} /> : <Send />}
          sx={{ py: 1.25 }}
        >
          {isLoading ? 'Generating...' : 'Generate Email Reply'}
        </Button>
      </form>
    </Paper>
  );
};

export default EmailReplyForm;
