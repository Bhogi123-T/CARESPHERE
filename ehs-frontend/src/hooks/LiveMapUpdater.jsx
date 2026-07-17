import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useLiveLocation } from './useLiveLocation';

export const LiveMapUpdater = ({ defaultCenter }) => {
  const map = useMap();
  const { location } = useLiveLocation();

  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], map.getZoom(), {
        animate: true,
        duration: 1.5
      });
    } else if (defaultCenter) {
      map.flyTo(defaultCenter, map.getZoom());
    }
  }, [location, defaultCenter, map]);

  return null;
};
