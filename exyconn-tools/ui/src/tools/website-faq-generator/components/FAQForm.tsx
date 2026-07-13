import React from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, MenuItem } from '@mui/material';
import { Language, Send } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface FAQFormProps {
  onSubmit: (url: string, count: number, tone: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  url: Yup.string().url('Please enter a valid URL').required('Website URL is required'),
  count: Yup.number().min(3).max(30).required(),
  tone: Yup.string().required(),
});

const FAQForm: React.FC<FAQFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { url: '', count: 10, tone: 'professional' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.url, values.count, values.tone),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Language color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Website URL
        </Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="url"
          label="Website URL"
          placeholder="https://example.com"
          value={formik.values.url}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.url && Boolean(formik.errors.url)}
          helperText={formik.touched.url && formik.errors.url}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          select
          name="count"
          label="Number of FAQs"
          value={formik.values.count}
          onChange={formik.handleChange}
          sx={{ mb: 2 }}
        >
          {[5, 10, 15, 20, 25, 30].map((n) => (
            <MenuItem key={n} value={n}>{n} FAQs</MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          select
          name="tone"
          label="Tone"
          value={formik.values.tone}
          onChange={formik.handleChange}
          sx={{ mb: 3 }}
        >
          <MenuItem value="professional">Professional</MenuItem>
          <MenuItem value="friendly">Friendly</MenuItem>
          <MenuItem value="technical">Technical</MenuItem>
          <MenuItem value="casual">Casual</MenuItem>
        </TextField>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading || !formik.values.url}
          startIcon={isLoading ? <CircularProgress size={18} /> : <Send />}
          sx={{ py: 1.25 }}
        >
          {isLoading ? 'Generating FAQs...' : 'Generate FAQs'}
        </Button>
      </form>
    </Paper>
  );
};

export default FAQForm;
