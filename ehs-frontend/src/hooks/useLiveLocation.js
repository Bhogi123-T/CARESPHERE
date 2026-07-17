import { useState, useEffect } from 'react';

export const useLiveLocation = () => {
  const [location, setLocation] = useState(null); // null until loaded
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);

    // Use watchPosition for continuous tracking
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
        // We do NOT set a fallback here. If it fails, it fails, so we don't send fake data.
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // Cleanup watcher when component unmounts
    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, []);

  return { location, error, isTracking };
};
