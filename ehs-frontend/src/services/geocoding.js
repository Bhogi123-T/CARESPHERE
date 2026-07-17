const GEOCODING_CACHE_KEY = 'ehs_geocoding_cache';

// A small built-in spatial dataset for offline reverse geocoding
const OFFLINE_LOCATIONS = [
  { name: 'Charminar, Hyderabad', lat: 17.3616, lng: 78.4747 },
  { name: 'HITEC City, Hyderabad', lat: 17.4435, lng: 78.3772 },
  { name: 'Banjara Hills, Hyderabad', lat: 17.4156, lng: 78.4347 },
  { name: 'Gachibowli, Hyderabad', lat: 17.4401, lng: 78.3489 },
  { name: 'Jubilee Hills, Hyderabad', lat: 17.4326, lng: 78.4071 },
  { name: 'Secunderabad', lat: 17.4399, lng: 78.4983 },
  { name: 'Kukatpally, Hyderabad', lat: 17.4948, lng: 78.3996 },
  { name: 'Begumpet, Hyderabad', lat: 17.4447, lng: 78.4664 },
  { name: 'Madhapur, Hyderabad', lat: 17.4483, lng: 78.3915 },
  { name: 'Kondapur, Hyderabad', lat: 17.4622, lng: 78.3568 },
  // Adding generic rural/outskirt anchors
  { name: 'Shamshabad (Airport Area)', lat: 17.2629, lng: 78.4300 },
  { name: 'Medchal (Rural)', lat: 17.6295, lng: 78.4819 }
];

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

function getOfflineLocation(lat, lng) {
  let nearest = OFFLINE_LOCATIONS[0];
  let minDistance = haversineDistance(lat, lng, nearest.lat, nearest.lng);
  
  for (let i = 1; i < OFFLINE_LOCATIONS.length; i++) {
    const loc = OFFLINE_LOCATIONS[i];
    const dist = haversineDistance(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = loc;
    }
  }
  
  // If we are within a reasonable distance (e.g. 50km)
  if (minDistance < 50) {
    return `${nearest.name} (Offline Model - ~${minDistance.toFixed(1)}km away)`;
  }
  
  return `Unknown Area - Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)} (Offline Model)`;
}

export const getLocationName = async (lat, lng) => {
  const cache = JSON.parse(localStorage.getItem(GEOCODING_CACHE_KEY) || '{}');
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

  if (navigator.onLine) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      
      let locationName = data.display_name.substring(0, 60);
      if (data.display_name.length > 60) locationName += '...';
      
      cache[cacheKey] = locationName;
      localStorage.setItem(GEOCODING_CACHE_KEY, JSON.stringify(cache));
      
      return locationName;
    } catch (err) {
      console.warn("Geocoding fetch failed or timed out, falling back to offline geocoding model.", err);
      return getFromCacheOrModel(cache, cacheKey, lat, lng);
    }
  } else {
    return getFromCacheOrModel(cache, cacheKey, lat, lng);
  }
};

const getFromCacheOrModel = (cache, cacheKey, lat, lng) => {
  if (cache[cacheKey]) {
    return cache[cacheKey] + ' (Offline Cache)';
  }
  return getOfflineLocation(lat, lng);
};
