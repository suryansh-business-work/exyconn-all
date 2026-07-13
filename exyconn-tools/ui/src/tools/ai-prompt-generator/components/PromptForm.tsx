import React from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { Psychology, AutoAwesome } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface PromptFormProps {
  onSubmit: (topic: string, context: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  topic: Yup.string().required('Topic is required').min(3, 'Topic must be at least 3 characters'),
  context: Yup.string(),
});

const PromptForm: React.FC<PromptFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { topic: '', context: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.topic, values.context),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Psychology color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Generate AI Prompt
        </Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="topic"
          label="Topic or Goal"
          placeholder="e.g., Write a marketing email for a SaaS product launch"
          value={formik.values.topic}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.topic && Boolean(formik.errors.topic)}
          helperText={formik.touched.topic && formik.errors.topic}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          name="context"
          label="Additional Context (Optional)"
          placeholder="Target audience, tone, specific requirements..."
          value={formik.values.context}
          onChange={formik.handleChange}
          multiline
          rows={3}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading || !formik.values.topic}
          startIcon={isLoading ? <CircularProgress size={18} /> : <AutoAwesome />}
          sx={{ py: 1.25 }}
        >
          {isLoading ? 'Generating...' : 'Generate Prompt'}
        </Button>
      </form>
    </Paper>
  );
};

export default PromptForm;
