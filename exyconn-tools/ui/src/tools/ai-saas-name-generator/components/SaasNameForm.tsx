import React from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, Chip } from '@mui/material';
import { Business, AutoAwesome } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface SaasNameFormProps {
  onSubmit: (description: string, keywords: string, style: string, count: number) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  description: Yup.string().required('Description is required').min(10, 'Describe your product in more detail'),
  keywords: Yup.string(),
  style: Yup.string(),
});

const styles = ['Modern', 'Playful', 'Professional', 'Tech', 'Minimal', 'Bold'];

const SaasNameForm: React.FC<SaasNameFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { description: '', keywords: '', style: 'Modern', count: 15 },
    validationSchema,
    onSubmit: (values) => onSubmit(values.description, values.keywords, values.style, values.count),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Business color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Generate SaaS Names
        </Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="description"
          label="Product Description"
          placeholder="e.g., A project management tool for remote teams..."
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.description && Boolean(formik.errors.description)}
          helperText={formik.touched.description && formik.errors.description}
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          name="keywords"
          label="Keywords (Optional)"
          placeholder="Keywords to inspire the name..."
          value={formik.values.keywords}
          onChange={formik.handleChange}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Naming Style
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {styles.map((s) => (
              <Chip
                key={s}
                label={s}
                onClick={() => formik.setFieldValue('style', s)}
                color={formik.values.style === s ? 'primary' : 'default'}
                variant={formik.values.style === s ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Number of names: {formik.values.count}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[10, 15, 20, 25].map((num) => (
              <Chip
                key={num}
                label={num}
                onClick={() => formik.setFieldValue('count', num)}
                color={formik.values.count === num ? 'primary' : 'default'}
                variant={formik.values.count === num ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading || !formik.values.description}
          startIcon={isLoading ? <CircularProgress size={18} /> : <AutoAwesome />}
          sx={{ py: 1.25 }}
        >
          {isLoading ? 'Generating...' : 'Generate Names'}
        </Button>
      </form>
    </Paper>
  );
};

export default SaasNameForm;
