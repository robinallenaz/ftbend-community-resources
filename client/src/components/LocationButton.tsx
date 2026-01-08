import { useState, useEffect } from 'react';
import type { Coordinates } from '../types';
import { getCurrentLocation, isGeolocationAvailable, getLocationPermission } from '../utils/locationUtils';

interface LocationButtonProps {
  onLocationFound: (location: Coordinates) => void;
  className?: string;
}

export default function LocationButton({ onLocationFound, className = '' }: LocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | null>(null);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    if (!isGeolocationAvailable()) {
      setError('Location services are not available on this device');
      return;
    }

    try {
      const status = await getLocationPermission();
      setPermissionStatus(status);
      
      if (status === 'denied') {
        setError('Location access denied. Please enable location services in your browser settings.');
      }
    } catch {
      setPermissionStatus('prompt');
    }
  };

  const handleLocationRequest = async () => {
    if (!isGeolocationAvailable()) {
      setError('Location services are not available on this device');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocation();
      
      if (location) {
        setPermissionStatus('granted');
        onLocationFound(location);
      } else {
        setError('Unable to get your location. Please check your location settings.');
      }
    } catch (err) {
      setError('Failed to get your location. Please try again.');
      console.error('Location error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (permissionStatus === 'denied' || error) {
    return (
      <div className={`text-sm text-vanillaCustard/70 ${className}`}>
        <span className="inline-flex items-center gap-1">
          📍 <span className="text-red-400">Location unavailable</span>
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleLocationRequest}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 rounded-xl bg-paleAmber px-4 py-2 text-base font-bold text-pitchBlack transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-pitchBlack disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label="Find resources near your current location"
    >
      {isLoading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-pitchBlack border-t-transparent"></div>
          Getting location...
        </>
      ) : (
        <>
          📍 Find Resources Near Me
        </>
      )}
    </button>
  );
}
