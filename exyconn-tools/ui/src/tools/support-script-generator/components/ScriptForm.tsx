import React from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, MenuItem } from '@mui/material';
import { SupportAgent, Send } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface ScriptFormProps {
  onSubmit: (topic: string, industry: string, tone: string, scenarios: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  topic: Yup.string().required('Topic is required').min(3, 'Must be at least 3 characters'),
  industry: Yup.string().required('Industry is required'),
  tone: Yup.string().required(),
  scenarios: Yup.string(),
});

const ScriptForm: React.FC<ScriptFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { topic: '', industry: '', tone: 'professional', scenarios: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.topic, values.industry, values.tone, values.scenarios),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SupportAgent color="primary" />
        <Typography variant="h6" fontWeight={600}>Script Details</Typography>
      </Box>
      <form onSubmit={formik.handleSubmit}>
        <TextField fullWidth name="topic" label="Support Topic" placeholder="e.g., Product returns, billing issues..."
          value={formik.values.topic} onChange={formik.handleChange} onBlur={formik.handleBlur}
          error={formik.touched.topic && Boolean(formik.errors.topic)}
          helperText={formik.touched.topic && formik.errors.topic} sx={{ mb: 2 }} />
        <TextField fullWidth name="industry" label="Industry" placeholder="e.g., E-commerce, SaaS, Healthcare..."
          value={formik.values.industry} onChange={formik.handleChange} onBlur={formik.handleBlur}
          error={formik.touched.industry && Boolean(formik.errors.industry)}
          helperText={formik.touched.industry && formik.errors.industry} sx={{ mb: 2 }} />
        <TextField fullWidth select name="tone" label="Tone" value={formik.values.tone}
          onChange={formik.handleChange} sx={{ mb: 2 }}>
          <MenuItem value="professional">Professional</MenuItem>
          <MenuItem value="friendly">Friendly</MenuItem>
          <MenuItem value="empathetic">Empathetic</MenuItem>
          <MenuItem value="formal">Formal</MenuItem>
        </TextField>
        <TextField fullWidth multiline rows={3} name="scenarios" label="Specific Scenarios (Optional)"
          placeholder="Describe specific customer scenarios..."
          value={formik.values.scenarios} onChange={formik.handleChange} sx={{ mb: 3 }} />
        <Button type="submit" variant="contained" fullWidth disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={18} /> : <Send />} sx={{ py: 1.25 }}>
          {isLoading ? 'Generating Script...' : 'Generate Support Script'}
        </Button>
      </form>
    </Paper>
  );
};

export default ScriptForm;
