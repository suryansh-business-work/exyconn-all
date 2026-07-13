import React from 'react';
import { Box, Button, TextField, Paper, Typography, CircularProgress } from '@mui/material';
import { Send, PictureAsPdf } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface PDFChatFormProps {
  onSubmit: (pdfContent: string, question: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  pdfContent: Yup.string().required('PDF content is required').min(50, 'Content too short'),
  question: Yup.string().required('Question is required').min(5, 'Question too short'),
});

const PDFChatForm: React.FC<PDFChatFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { pdfContent: '', question: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.pdfContent, values.question),
  });

  return (
    <Paper elevation={0} sx={{ p: 2.5, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <PictureAsPdf color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Chat With PDF Content
        </Typography>
      </Box>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="pdfContent"
          label="Paste PDF Text Content"
          placeholder="Paste extracted PDF text here..."
          multiline
          rows={6}
          value={formik.values.pdfContent}
          onChange={formik.handleChange}
          error={formik.touched.pdfContent && Boolean(formik.errors.pdfContent)}
          helperText={formik.touched.pdfContent && formik.errors.pdfContent}
          sx={{ mb: 2 }}
          size="small"
        />
        <TextField
          fullWidth
          name="question"
          label="Your Question"
          placeholder="Ask about this PDF..."
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

export default PDFChatForm;
