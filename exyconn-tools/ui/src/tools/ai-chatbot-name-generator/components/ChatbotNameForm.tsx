import React from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, Chip } from '@mui/material';
import { SmartToy, AutoAwesome } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface ChatbotNameFormProps {
  onSubmit: (purpose: string, personality: string, count: number) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  purpose: Yup.string().required('Purpose is required').min(10, 'Describe the purpose in more detail'),
  personality: Yup.string(),
});

const personalities = ['Friendly', 'Professional', 'Playful', 'Helpful', 'Smart', 'Energetic'];

const ChatbotNameForm: React.FC<ChatbotNameFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { purpose: '', personality: 'Friendly', count: 15 },
    validationSchema,
    onSubmit: (values) => onSubmit(values.purpose, values.personality, values.count),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SmartToy color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Generate Chatbot Names
        </Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="purpose"
          label="Chatbot Purpose"
          placeholder="e.g., Customer support for e-commerce, HR assistant..."
          value={formik.values.purpose}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.purpose && Boolean(formik.errors.purpose)}
          helperText={formik.touched.purpose && formik.errors.purpose}
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Personality
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {personalities.map((p) => (
              <Chip
                key={p}
                label={p}
                onClick={() => formik.setFieldValue('personality', p)}
                color={formik.values.personality === p ? 'primary' : 'default'}
                variant={formik.values.personality === p ? 'filled' : 'outlined'}
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
          disabled={isLoading || !formik.values.purpose}
          startIcon={isLoading ? <CircularProgress size={18} /> : <AutoAwesome />}
          sx={{ py: 1.25 }}
        >
          {isLoading ? 'Generating...' : 'Generate Names'}
        </Button>
      </form>
    </Paper>
  );
};

export default ChatbotNameForm;
