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
import { Create, Send } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface LetterFormProps {
  onSubmit: (purpose: string, letterType: string, recipient: string, details: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  purpose: Yup.string().required('Purpose is required').min(10, 'Describe the purpose in more detail'),
  letterType: Yup.string().required('Letter type is required'),
  recipient: Yup.string().required('Recipient is required'),
  details: Yup.string(),
});

const letterTypes = [
  'Cover Letter',
  'Recommendation',
  'Resignation',
  'Complaint',
  'Thank You',
  'Invitation',
  'Apology',
  'Request',
  'Business Proposal',
];

const LetterForm: React.FC<LetterFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { purpose: '', letterType: 'Cover Letter', recipient: '', details: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.purpose, values.letterType, values.recipient, values.details),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Create color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Generate Letter
        </Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Letter Type</InputLabel>
          <Select name="letterType" value={formik.values.letterType} onChange={formik.handleChange} label="Letter Type">
            {letterTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          name="recipient"
          label="Recipient"
          placeholder="e.g., Hiring Manager, Company Name, etc."
          value={formik.values.recipient}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.recipient && Boolean(formik.errors.recipient)}
          helperText={formik.touched.recipient && formik.errors.recipient}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          name="purpose"
          label="Purpose"
          placeholder="Describe the purpose of your letter..."
          value={formik.values.purpose}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.purpose && Boolean(formik.errors.purpose)}
          helperText={formik.touched.purpose && formik.errors.purpose}
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          name="details"
          label="Additional Details (Optional)"
          placeholder="Key points, your background, specific requirements..."
          value={formik.values.details}
          onChange={formik.handleChange}
          multiline
          rows={2}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading || !formik.values.purpose || !formik.values.recipient}
          startIcon={isLoading ? <CircularProgress size={18} /> : <Send />}
          sx={{ py: 1.25 }}
        >
          {isLoading ? 'Generating...' : 'Generate Letter'}
        </Button>
      </form>
    </Paper>
  );
};

export default LetterForm;
