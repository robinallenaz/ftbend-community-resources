import type { Coordinates, LocationData, Resource } from '../types';

// Predefined location data for Fort Bend County areas
export const locationData: LocationData[] = [
  {
    name: 'Fort Bend',
    coordinates: { latitude: 29.5656, longitude: -95.6572 },
    radius: 25, // miles
  },
  {
    name: 'Houston',
    coordinates: { latitude: 29.7604, longitude: -95.3698 },
    radius: 50, // miles
  },
  {
    name: 'South TX',
    coordinates: { latitude: 27.8006, longitude: -97.3963 },
    radius: 100, // miles
  },
  {
    name: 'TX',
    coordinates: { latitude: 31.9686, longitude: -99.9018 },
    radius: 300, // miles
  },
  {
    name: 'Virtual',
    coordinates: { latitude: 0, longitude: 0 },
    radius: 0, // Virtual services
  },
];

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Get user's current location
export function getCurrentLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

// Filter resources by distance from user's location
export function filterResourcesByDistance(
  resources: Resource[],
  userLocation: Coordinates,
  maxDistance: number = 50 // miles
): Resource[] {
  return resources
    .filter((resource) => {
      // Skip virtual resources for distance filtering
      if (resource.locations.includes('Virtual') && resource.locations.length === 1) {
        return false;
      }

      // Check if resource has specific coordinates
      if (resource.coordinates) {
        const distance = calculateDistance(userLocation, resource.coordinates);
        return distance <= maxDistance;
      }

      // Check against predefined location data
      for (const location of resource.locations) {
        if (location === 'Virtual') continue;
        
        const locationInfo = locationData.find((loc) => loc.name === location);
        if (locationInfo) {
          const distance = calculateDistance(userLocation, locationInfo.coordinates);
          if (distance <= maxDistance) {
            return true;
          }
        }
      }

      return false;
    })
    .sort((a, b) => {
      // Sort by distance
      const distanceA = getResourceDistance(a, userLocation);
      const distanceB = getResourceDistance(b, userLocation);
      return (distanceA ?? Infinity) - (distanceB ?? Infinity);
    });
}

// Get distance to a specific resource
export function getResourceDistance(
  resource: Resource,
  userLocation: Coordinates
): number | null {
  // If resource has specific coordinates
  if (resource.coordinates) {
    return calculateDistance(userLocation, resource.coordinates);
  }

  // Check against predefined location data
  let minDistance: number | null = null;
  for (const location of resource.locations) {
    if (location === 'Virtual') continue;
    
    const locationInfo = locationData.find((loc) => loc.name === location);
    if (locationInfo) {
      const distance = calculateDistance(userLocation, locationInfo.coordinates);
      if (minDistance === null || distance < minDistance) {
        minDistance = distance;
      }
    }
  }

  return minDistance;
}

// Format distance for display with accuracy indicator
export function formatDistance(distance: number, isPrecise: boolean = false): string {
  const accuracyIcon = isPrecise ? '📍' : '🗺️';
  
  if (distance < 1) {
    return `${accuracyIcon} < 1 mile`;
  }
  if (distance < 5) {
    return `${accuracyIcon} ${Math.round(distance)} miles`;
  }
  return `${accuracyIcon} ~${Math.round(distance)} miles`;
}

// Get accuracy level for a resource
export function getAccuracyLevel(resource: Resource): 'precise' | 'approximate' {
  return resource.coordinates ? 'precise' : 'approximate';
}

// Check if geolocation is available
export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator;
}

// Get location permission status
export async function getLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.permissions) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'prompt';
  }
}
