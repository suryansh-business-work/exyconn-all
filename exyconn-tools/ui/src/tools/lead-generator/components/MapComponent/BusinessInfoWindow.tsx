import React from 'react';
import { Box, Typography } from '@mui/material';
import { InfoWindow } from '@react-google-maps/api';
import { Business } from '../../types';

interface BusinessInfoWindowProps {
  business: Business;
  onClose: () => void;
}

const BusinessInfoWindow: React.FC<BusinessInfoWindowProps> = ({ business, onClose }) => (
  <InfoWindow
    position={{
      lat: business.location.lat,
      lng: business.location.lng,
    }}
    onCloseClick={onClose}
  >
    <Box sx={{ maxWidth: 250, p: 0.5 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        {business.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {business.address}
      </Typography>
      {business.rating && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          ⭐ {business.rating} ({business.totalRatings} reviews)
        </Typography>
      )}
      {business.phone && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          📞 {business.phone}
        </Typography>
      )}
    </Box>
  </InfoWindow>
);

export default BusinessInfoWindow;
