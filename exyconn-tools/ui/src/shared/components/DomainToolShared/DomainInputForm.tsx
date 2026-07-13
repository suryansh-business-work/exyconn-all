import React from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { Send } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface DomainInputFormProps {
  onSubmit: (domain: string) => void;
  isLoading: boolean;
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  title?: string;
  buttonText?: string;
  loadingText?: string;
}

const validationSchema = Yup.object({
  domain: Yup.string().required('Domain is required').min(3, 'Enter a valid domain'),
});

const DomainInputForm: React.FC<DomainInputFormProps> = ({
  onSubmit,
  isLoading,
  label = 'Domain',
  placeholder = 'example.com',
  icon,
  title = 'Enter Domain',
  buttonText = 'Check',
  loadingText = 'Checking...',
}) => {
  const formik = useFormik({
    initialValues: { domain: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.domain),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {icon}
        <Typography variant="h6" fontWeight={600}>{title}</Typography>
      </Box>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="domain"
          label={label}
          placeholder={placeholder}
          value={formik.values.domain}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.domain && Boolean(formik.errors.domain)}
          helperText={formik.touched.domain && formik.errors.domain}
          sx={{ mb: 3 }}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading || !formik.values.domain}
          startIcon={isLoading ? <CircularProgress size={18} /> : <Send />}
          sx={{ py: 1.25 }}
        >
          {isLoading ? loadingText : buttonText}
        </Button>
      </form>
    </Paper>
  );
};

export default DomainInputForm;
