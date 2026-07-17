import { useState, useEffect } from 'react';
import { getLocationName as fetchLocationName } from '../services/geocoding';

export const useLocationName = (defaultLocation = 'Detecting Location...') => {
  const [locationName, setLocationName] = useState(defaultLocation);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const locName = await fetchLocationName(pos.coords.latitude, pos.coords.longitude);
          setLocationName(locName);
        } catch(e) {
          setLocationName(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
      }, () => {
        setLocationName('Hyderabad (Default)');
      });
    } else {
      setLocationName('Location not supported');
    }
  }, []);

  return locationName;
};
