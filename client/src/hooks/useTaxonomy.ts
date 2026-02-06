import { useState, useEffect, useCallback, useRef } from 'react';
import type { TaxonomyItem, TaxonomyType } from '../types';

export function useTaxonomy(type: TaxonomyType) {
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchItems = useCallback(async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/taxonomy/active/${type}`, {
        signal: abortController.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch taxonomy items (${response.status})`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from server');
      }

      // Validate each item structure
      const validatedItems = data.filter((item): item is TaxonomyItem => {
        if (typeof item !== 'object' || item === null) return false;
        
        const taxonomyItem = item as any;
        return (
          typeof taxonomyItem._id === 'string' &&
          typeof taxonomyItem.type === 'string' &&
          typeof taxonomyItem.value === 'string' &&
          typeof taxonomyItem.label === 'string' &&
          (taxonomyItem.description === undefined || typeof taxonomyItem.description === 'string') &&
          typeof taxonomyItem.isActive === 'boolean' &&
          typeof taxonomyItem.sortOrder === 'number'
        );
      });

      setItems(validatedItems);
      
      // Log warning if items were filtered out due to validation failures
      if (validatedItems.length !== data.length) {
        console.warn(`Filtered out ${data.length - validatedItems.length} invalid taxonomy items of type "${type}". This may indicate data corruption or schema mismatches.`, {
          originalCount: data.length,
          validCount: validatedItems.length,
          type: type
        });
      }
    } catch (err: any) {
      // Don't show error for aborted requests
      if (err.name !== 'AbortError') {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchItems();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [type]);

  return { items, isLoading, error, refetch: fetchItems };
}

export function useAllTaxonomy() {
  const [locations, setLocations] = useState<TaxonomyItem[]>([]);
  const [resourceTypes, setResourceTypes] = useState<TaxonomyItem[]>([]);
  const [audiences, setAudiences] = useState<TaxonomyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function fetchAll() {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      setError(null);
      setIsLoading(true);
      
      try {
        const [locationsRes, typesRes, audiencesRes] = await Promise.all([
          fetch('/api/taxonomy/active/location', { signal: abortController.signal }),
          fetch('/api/taxonomy/active/resourceType', { signal: abortController.signal }),
          fetch('/api/taxonomy/active/audience', { signal: abortController.signal }),
        ]);

        if (!locationsRes.ok || !typesRes.ok || !audiencesRes.ok) {
          throw new Error('Failed to fetch taxonomy items');
        }

        const [locationsData, typesData, audiencesData] = await Promise.all([
          locationsRes.json(),
          typesRes.json(),
          audiencesRes.json(),
        ]);

        // Validate response structures
        const validateTaxonomyItems = (data: unknown): TaxonomyItem[] => {
          if (!Array.isArray(data)) {
            throw new Error('Invalid response format from server');
          }

          return data.filter((item): item is TaxonomyItem => {
            if (typeof item !== 'object' || item === null) return false;
            
            const taxonomyItem = item as any;
            return (
              typeof taxonomyItem._id === 'string' &&
              typeof taxonomyItem.type === 'string' &&
              typeof taxonomyItem.value === 'string' &&
              typeof taxonomyItem.label === 'string' &&
              (taxonomyItem.description === undefined || typeof taxonomyItem.description === 'string') &&
              typeof taxonomyItem.isActive === 'boolean' &&
              typeof taxonomyItem.sortOrder === 'number'
            );
          });
        };

        // Validate each dataset once and store results
        const validatedLocations = validateTaxonomyItems(locationsData);
        const validatedTypes = validateTaxonomyItems(typesData);
        const validatedAudiences = validateTaxonomyItems(audiencesData);

        setLocations(validatedLocations);
        setResourceTypes(validatedTypes);
        setAudiences(validatedAudiences);
        
        // Log warnings for any filtered items using the validated results
        const logValidationWarnings = (originalData: unknown, validatedData: TaxonomyItem[], type: string) => {
          if (validatedData.length !== (originalData as any[]).length) {
            console.warn(`Filtered out ${(originalData as any[]).length - validatedData.length} invalid taxonomy items of type "${type}". This may indicate data corruption or schema mismatches.`, {
              originalCount: (originalData as any[]).length,
              validCount: validatedData.length,
              type: type
            });
          }
        };
        
        logValidationWarnings(locationsData, validatedLocations, 'location');
        logValidationWarnings(typesData, validatedTypes, 'resourceType');
        logValidationWarnings(audiencesData, validatedAudiences, 'audience');
      } catch (err: any) {
        // Don't show error for aborted requests
        if (err.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { locations, resourceTypes, audiences, isLoading, error };
}
