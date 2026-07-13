import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Email,
  Phone,
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  YouTube,
  ContentCopy,
  CheckCircle,
} from '@mui/icons-material';
import { ExtractionResult } from '../types';

interface ResultsSummaryProps {
  result: ExtractionResult;
}

const socialIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook sx={{ color: '#1877f2' }} />,
  twitter: <Twitter sx={{ color: '#1da1f2' }} />,
  linkedin: <LinkedIn sx={{ color: '#0a66c2' }} />,
  instagram: <Instagram sx={{ color: '#e4405f' }} />,
  youtube: <YouTube sx={{ color: '#ff0000' }} />,
};

const ResultsSummary: React.FC<ResultsSummaryProps> = ({ result }) => {
  const [copiedItem, setCopiedItem] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleCopyAll = (items: string[], type: string) => {
    navigator.clipboard.writeText(items.join('\n'));
    setCopiedItem(`all-${type}`);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Extraction Results
        </Typography>
        <Chip label={`${result.pagesScanned} pages scanned`} size="small" color="primary" />
      </Box>

      {/* Emails Section */}
      {result.totalEmails.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email color="primary" fontSize="small" />
              <Typography variant="subtitle2">Emails ({result.totalEmails.length})</Typography>
            </Box>
            <Tooltip title="Copy all emails">
              <IconButton size="small" onClick={() => handleCopyAll(result.totalEmails, 'emails')}>
                {copiedItem === 'all-emails' ? (
                  <CheckCircle fontSize="small" color="success" />
                ) : (
                  <ContentCopy fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {result.totalEmails.map((email, idx) => (
              <Chip
                key={idx}
                label={email}
                size="small"
                variant="outlined"
                onClick={() => handleCopy(email, `email-${idx}`)}
                icon={copiedItem === `email-${idx}` ? <CheckCircle color="success" /> : undefined}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Phones Section */}
      {result.totalPhones.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone color="primary" fontSize="small" />
              <Typography variant="subtitle2">Phone Numbers ({result.totalPhones.length})</Typography>
            </Box>
            <Tooltip title="Copy all phones">
              <IconButton size="small" onClick={() => handleCopyAll(result.totalPhones, 'phones')}>
                {copiedItem === 'all-phones' ? (
                  <CheckCircle fontSize="small" color="success" />
                ) : (
                  <ContentCopy fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {result.totalPhones.map((phone, idx) => (
              <Chip
                key={idx}
                label={phone}
                size="small"
                variant="outlined"
                onClick={() => handleCopy(phone, `phone-${idx}`)}
                icon={copiedItem === `phone-${idx}` ? <CheckCircle color="success" /> : undefined}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Social Links Section */}
      {Object.keys(result.socialLinks).length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Social Media Links
            </Typography>
            <List dense disablePadding>
              {Object.entries(result.socialLinks).map(([platform, url]) => (
                <ListItem
                  key={platform}
                  secondaryAction={
                    <IconButton size="small" onClick={() => handleCopy(url, `social-${platform}`)}>
                      {copiedItem === `social-${platform}` ? (
                        <CheckCircle fontSize="small" color="success" />
                      ) : (
                        <ContentCopy fontSize="small" />
                      )}
                    </IconButton>
                  }
                  sx={{ px: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{socialIcons[platform] || <Email />}</ListItemIcon>
                  <ListItemText
                    primary={platform.charAt(0).toUpperCase() + platform.slice(1)}
                    secondary={url}
                    secondaryTypographyProps={{
                      sx: { fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </>
      )}

      {result.totalEmails.length === 0 &&
        result.totalPhones.length === 0 &&
        Object.keys(result.socialLinks).length === 0 && (
          <Typography color="text.secondary" textAlign="center" py={3}>
            No contacts found on this website
          </Typography>
        )}
    </Paper>
  );
};

export default ResultsSummary;
