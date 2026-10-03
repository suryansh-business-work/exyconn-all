import React from 'react';
import { useRouteSeo } from './useRouteSeo';

/** Mount once inside the router; renders nothing, keeps the head in sync with the route. */
const RouteSeo: React.FC = () => {
  useRouteSeo();
  return null;
};

export default RouteSeo;
