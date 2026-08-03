import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';

const MapboxGlobe = ({ location, ambulance, hospital }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const ambulanceMarker = useRef(null);
  const hospitalMarker = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'google-maps': {
            type: 'raster',
            tiles: [
              'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            ],
            tileSize: 256,
            attribution: 'Google Maps'
          }
        },
        layers: [
          {
            id: 'google-maps-layer',
            type: 'raster',
            source: 'google-maps',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: location && location.lat ? [location.lng, location.lat] : [78.4867, 17.3850],
      zoom: 1, // Start zoomed out to see the globe
      projection: {
          type: 'globe'
      }
    });

    map.current.on('style.load', () => {
        map.current.setProjection({ type: 'globe' });
    });
  }, []);

  // Update User Marker
  useEffect(() => {
    if (!map.current || !location || !location.lat) return;

    if (!userMarker.current) {
      userMarker.current = new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat([location.lng, location.lat])
        .setPopup(new maplibregl.Popup({ closeButton: false }).setHTML('<div class="text-xs font-bold px-2 py-1">You</div>'))
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([location.lng, location.lat]);
    }
  }, [location]);

  // Update Ambulance Marker & Fly to it
  useEffect(() => {
    if (!map.current || !ambulance || !ambulance.lat) return;

    if (!ambulanceMarker.current) {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 rounded-full bg-white shadow-[0_0_15px_rgba(34,197,94,0.5)] flex items-center justify-center text-xl';
      el.innerHTML = '🚑';
      
      ambulanceMarker.current = new maplibregl.Marker(el)
        .setLngLat([ambulance.lng, ambulance.lat])
        .setPopup(new maplibregl.Popup({ closeButton: false }).setHTML('<div class="text-xs font-bold text-green-600 px-2 py-1">Ambulance</div>'))
        .addTo(map.current);
    } else {
      ambulanceMarker.current.setLngLat([ambulance.lng, ambulance.lat]);
    }

    // Smoothly fly to the new location and zoom in if we were zoomed out
    map.current.flyTo({ 
      center: [ambulance.lng, ambulance.lat], 
      zoom: Math.max(map.current.getZoom(), 12),
      speed: 1.2 
    });
  }, [ambulance]);

  // Update Hospital Marker
  useEffect(() => {
    if (!map.current || !hospital || !hospital.lat) return;

    if (!hospitalMarker.current) {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 rounded-lg bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] border-2 border-white flex items-center justify-center text-xl';
      el.innerHTML = '🏥';
      
      hospitalMarker.current = new maplibregl.Marker(el)
        .setLngLat([hospital.lng, hospital.lat])
        .setPopup(new maplibregl.Popup({ closeButton: false, offset: 20 }).setHTML('<div class="text-xs font-bold text-blue-600 px-2 py-1">Hospital</div>'))
        .addTo(map.current);
    } else {
      hospitalMarker.current.setLngLat([hospital.lng, hospital.lat]);
    }

    // Try to fit bounds to show both hospital and user if possible
    if (location && location.lat) {
      const bounds = new maplibregl.LngLatBounds()
        .extend([location.lng, location.lat])
        .extend([hospital.lng, hospital.lat]);
      if (ambulance && ambulance.lat) {
        bounds.extend([ambulance.lng, ambulance.lat]);
      }
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14, speed: 1.2 });
    }
  }, [hospital, location, ambulance]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
  );
};

export default MapboxGlobe;
