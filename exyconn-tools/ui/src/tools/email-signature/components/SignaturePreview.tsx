import React, { useMemo } from 'react';
import { Box, Paper, Typography, Chip, useTheme } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { SignatureFormValues } from '../types';
import { generateSignatureHTML } from '../utils/generateSignature';

interface SignaturePreviewProps {
  values: SignatureFormValues;
}

const SignaturePreview: React.FC<SignaturePreviewProps> = ({ values }) => {
  const theme = useTheme();

  const signatureHTML = useMemo(() => generateSignatureHTML(values), [values]);

  const hasContent = values.fullName.trim() !== '';

  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Visibility fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>
            Live Preview
          </Typography>
        </Box>
        <Chip
          label={values.template.charAt(0).toUpperCase() + values.template.slice(1)}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Preview Area */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fafafa',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          overflow: 'auto',
        }}
      >
        {hasContent ? (
          <Box
            sx={{
              bgcolor: 'background.paper',
              p: 3,
              borderRadius: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              maxWidth: '100%',
              overflow: 'auto',
            }}
          >
            <Box
              dangerouslySetInnerHTML={{ __html: signatureHTML }}
              sx={{
                '& a': {
                  color: 'inherit',
                },
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                },
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 4,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Start Creating Your Signature
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your name in the form to see a live preview of your email signature here.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Email Context Preview */}
      {hasContent && (
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            px: 2,
            py: 1.5,
            bgcolor: 'background.default',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            This is how your signature will appear at the bottom of your emails.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SignaturePreview;
