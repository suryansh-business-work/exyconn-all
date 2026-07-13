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
import { Reply, Send } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface ReplyFormProps {
  onSubmit: (message: string, tone: string, context: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  message: Yup.string().required('Message is required').min(5, 'Message must be at least 5 characters'),
  tone: Yup.string().required('Tone is required'),
  context: Yup.string(),
});

const tones = ['Professional', 'Friendly', 'Casual', 'Formal', 'Enthusiastic', 'Empathetic', 'Concise'];

const ReplyForm: React.FC<ReplyFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { message: '', tone: 'Professional', context: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.message, values.tone, values.context),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Reply color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Generate Reply
        </Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="message"
          label="Original Message"
          placeholder="Paste the message you want to reply to..."
          value={formik.values.message}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.message && Boolean(formik.errors.message)}
          helperText={formik.touched.message && formik.errors.message}
          multiline
          rows={4}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Tone</InputLabel>
          <Select name="tone" value={formik.values.tone} onChange={formik.handleChange} label="Tone">
            {tones.map((tone) => (
              <MenuItem key={tone} value={tone}>
                {tone}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          name="context"
          label="Additional Context (Optional)"
          placeholder="Any specific points to include..."
          value={formik.values.context}
          onChange={formik.handleChange}
          multiline
          rows={2}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading || !formik.values.message}
          startIcon={isLoading ? <CircularProgress size={18} /> : <Send />}
          sx={{ py: 1.25 }}
        >
          {isLoading ? 'Generating...' : 'Generate Reply'}
        </Button>
      </form>
    </Paper>
  );
};

export default ReplyForm;
