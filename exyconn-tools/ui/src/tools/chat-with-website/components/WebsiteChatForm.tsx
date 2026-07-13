import React from 'react';
import { Box, Button, TextField, Paper, Typography, CircularProgress } from '@mui/material';
import { Send, Language } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface WebsiteChatFormProps {
  onSubmit: (websiteContent: string, question: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  websiteContent: Yup.string().required('Website content is required').min(50, 'Content too short'),
  question: Yup.string().required('Question is required').min(5, 'Question too short'),
});

const WebsiteChatForm: React.FC<WebsiteChatFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { websiteContent: '', question: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.websiteContent, values.question),
  });

  return (
    <Paper elevation={0} sx={{ p: 2.5, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Language color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Chat With Website Content
        </Typography>
      </Box>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="websiteContent"
          label="Paste Website Content"
          placeholder="Paste the website text content here..."
          multiline
          rows={6}
          value={formik.values.websiteContent}
          onChange={formik.handleChange}
          error={formik.touched.websiteContent && Boolean(formik.errors.websiteContent)}
          helperText={formik.touched.websiteContent && formik.errors.websiteContent}
          sx={{ mb: 2 }}
          size="small"
        />
        <TextField
          fullWidth
          name="question"
          label="Your Question"
          placeholder="Ask a question about this website..."
          value={formik.values.question}
          onChange={formik.handleChange}
          error={formik.touched.question && Boolean(formik.errors.question)}
          helperText={formik.touched.question && formik.errors.question}
          sx={{ mb: 2 }}
          size="small"
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={18} /> : <Send />}
          sx={{ py: 1 }}
        >
          {isLoading ? 'Generating...' : 'Ask Question'}
        </Button>
      </form>
    </Paper>
  );
};

export default WebsiteChatForm;
