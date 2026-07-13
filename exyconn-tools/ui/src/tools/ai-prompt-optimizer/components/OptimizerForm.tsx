import React from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { AutoAwesome, TuneOutlined } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface OptimizerFormProps {
  onSubmit: (prompt: string, goal: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  prompt: Yup.string().required('Prompt is required').min(10, 'Prompt must be at least 10 characters'),
  goal: Yup.string(),
});

const OptimizerForm: React.FC<OptimizerFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { prompt: '', goal: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.prompt, values.goal),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TuneOutlined color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Optimize Your Prompt
        </Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="prompt"
          label="Your Current Prompt"
          placeholder="Paste your existing prompt here..."
          value={formik.values.prompt}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.prompt && Boolean(formik.errors.prompt)}
          helperText={formik.touched.prompt && formik.errors.prompt}
          multiline
          rows={5}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          name="goal"
          label="Optimization Goal (Optional)"
          placeholder="e.g., Make it more concise, add more context, improve clarity..."
          value={formik.values.goal}
          onChange={formik.handleChange}
          multiline
          rows={2}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading || !formik.values.prompt}
          startIcon={isLoading ? <CircularProgress size={18} /> : <AutoAwesome />}
          sx={{ py: 1.25 }}
        >
          {isLoading ? 'Optimizing...' : 'Optimize Prompt'}
        </Button>
      </form>
    </Paper>
  );
};

export default OptimizerForm;
