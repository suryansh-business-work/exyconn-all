import React, { useState, useCallback, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Box } from '@mui/material';
import { APISettings, STORAGE_KEYS } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import MapControls from './MapControls';
import MapLoadingStates from './MapLoadingStates';
import MapRenderer from './MapRenderer';
import { useMapDrawing } from './useMapDrawing';
import { libraries, defaultCenter, MapComponentProps } from './types';

const MapComponent: React.FC<MapComponentProps> = ({
  businesses,
  onPolygonComplete,
  onClearPolygon,
  selectedBusiness,
  onBusinessSelect,
  polygonCoordinates,
  onDrawPolygonRef,
  externalCenter,
}) => {
  const [settings] = useLocalStorage<APISettings>(STORAGE_KEYS.API_SETTINGS, {
    googleMapsApiKey: '',
    googlePlacesApiKey: '',
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: settings.googleMapsApiKey,
    libraries,
  });

  const { isDrawing, polygonRef, triggerDrawPolygon, handleClearPolygon } = useMapDrawing({
    map,
    isLoaded,
    onPolygonComplete,
    onClearPolygon,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCenter({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => console.log('Geolocation permission denied')
      );
    }
  }, []);

  useEffect(() => {
    if (externalCenter && map) {
      setCenter(externalCenter);
      map.panTo(externalCenter);
      map.setZoom(14);
    }
  }, [externalCenter, map]);

  useEffect(() => {
    if (onDrawPolygonRef) onDrawPolygonRef(triggerDrawPolygon);
  }, [onDrawPolygonRef, triggerDrawPolygon]);

  const onLoad = useCallback((map: google.maps.Map) => setMap(map), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const handleCenterOnUser = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCenter(newCenter);
          map.panTo(newCenter);
          map.setZoom(14);
        },
        () => alert('Unable to get your location')
      );
    }
  };

  if (!settings.googleMapsApiKey || loadError || !isLoaded) {
    return <MapLoadingStates apiKey={settings.googleMapsApiKey} loadError={loadError} isLoaded={isLoaded} />;
  }

  return (
    <Box sx={{ height: '100%', position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
      <MapRenderer
        center={center}
        polygonCoordinates={polygonCoordinates}
        polygonRef={polygonRef}
        businesses={businesses}
        selectedBusiness={selectedBusiness}
        onBusinessSelect={onBusinessSelect}
        onLoad={onLoad}
        onUnmount={onUnmount}
      />
      <MapControls
        isDrawing={isDrawing}
        hasPolygon={polygonCoordinates.length > 0}
        onDraw={triggerDrawPolygon}
        onClear={handleClearPolygon}
        onCenterOnUser={handleCenterOnUser}
      />
    </Box>
  );
};

export default MapComponent;
