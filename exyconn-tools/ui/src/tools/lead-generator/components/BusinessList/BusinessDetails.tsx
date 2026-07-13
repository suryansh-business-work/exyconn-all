import React from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Phone, Language, Place, Star, ContentCopy, OpenInNew } from '@mui/icons-material';
import { Business } from '../../types';

interface BusinessDetailsProps {
  business: Business;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

const BusinessDetails: React.FC<BusinessDetailsProps> = ({ business, copiedField, onCopy }) => {
  return (
    <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
      {/* Address */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        <Place fontSize="small" color="action" sx={{ mt: 0.25 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2">{business.address}</Typography>
        </Box>
        <Tooltip title={copiedField === `address-${business.placeId}` ? 'Copied!' : 'Copy'}>
          <IconButton size="small" onClick={() => onCopy(business.address, `address-${business.placeId}`)}>
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Phone */}
      {business.phone && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Phone fontSize="small" color="action" />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {business.phone}
          </Typography>
          <Tooltip title={copiedField === `phone-${business.placeId}` ? 'Copied!' : 'Copy'}>
            <IconButton size="small" onClick={() => onCopy(business.phone!, `phone-${business.placeId}`)}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Website */}
      {business.website && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Language fontSize="small" color="action" />
          <Typography
            variant="body2"
            sx={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {business.website}
          </Typography>
          <Tooltip title="Open Website">
            <IconButton size="small" onClick={() => window.open(business.website, '_blank')}>
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Rating */}
      {business.rating && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Star fontSize="small" color="warning" />
          <Typography variant="body2">
            {business.rating} ({business.totalRatings} reviews)
          </Typography>
        </Box>
      )}

      {/* Business Types */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {business.types.slice(0, 5).map((type) => (
          <Chip
            key={type}
            label={type.replace(/_/g, ' ')}
            size="small"
            variant="outlined"
            sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.65rem' } }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default BusinessDetails;
