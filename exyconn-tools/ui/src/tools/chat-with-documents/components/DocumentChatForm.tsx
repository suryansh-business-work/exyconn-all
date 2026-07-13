import React from 'react';
import { Box, Button, TextField, Paper, Typography, CircularProgress } from '@mui/material';
import { Send, Description } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface DocumentChatFormProps {
  onSubmit: (documentContent: string, question: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  documentContent: Yup.string().required('Document content is required').min(50, 'Content too short'),
  question: Yup.string().required('Question is required').min(5, 'Question too short'),
});

const DocumentChatForm: React.FC<DocumentChatFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { documentContent: '', question: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.documentContent, values.question),
  });

  return (
    <Paper elevation={0} sx={{ p: 2.5, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Description color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Chat With Document
        </Typography>
      </Box>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="documentContent"
          label="Paste Document Content"
          placeholder="Paste document text here..."
          multiline
          rows={6}
          value={formik.values.documentContent}
          onChange={formik.handleChange}
          error={formik.touched.documentContent && Boolean(formik.errors.documentContent)}
          helperText={formik.touched.documentContent && formik.errors.documentContent}
          sx={{ mb: 2 }}
          size="small"
        />
        <TextField
          fullWidth
          name="question"
          label="Your Question"
          placeholder="Ask about this document..."
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

export default DocumentChatForm;
