import React from 'react';
import { GoogleMap, Polygon, Marker } from '@react-google-maps/api';
import { Business, PolygonCoordinates } from '../../types';
import BusinessInfoWindow from './BusinessInfoWindow';
import { mapContainerStyle, mapOptions, polygonOptions } from './types';

interface MapRendererProps {
  center: { lat: number; lng: number };
  polygonCoordinates: PolygonCoordinates[];
  polygonRef: React.MutableRefObject<google.maps.Polygon | null>;
  businesses: Business[];
  selectedBusiness: Business | null;
  onBusinessSelect: (business: Business | null) => void;
  onLoad: (map: google.maps.Map) => void;
  onUnmount: () => void;
}

const MapRenderer: React.FC<MapRendererProps> = ({
  center,
  polygonCoordinates,
  polygonRef,
  businesses,
  selectedBusiness,
  onBusinessSelect,
  onLoad,
  onUnmount,
}) => {
  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={12}
      options={mapOptions}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {polygonCoordinates.length > 0 && !polygonRef.current && (
        <Polygon
          paths={polygonCoordinates}
          options={polygonOptions}
          onLoad={(polygon) => {
            polygonRef.current = polygon;
          }}
        />
      )}

      {businesses.map((business) => (
        <Marker
          key={business.placeId}
          position={{ lat: business.location.lat, lng: business.location.lng }}
          title={business.name}
          onClick={() => onBusinessSelect(business)}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32),
          }}
        />
      ))}

      {selectedBusiness && <BusinessInfoWindow business={selectedBusiness} onClose={() => onBusinessSelect(null)} />}
    </GoogleMap>
  );
};

export default MapRenderer;
