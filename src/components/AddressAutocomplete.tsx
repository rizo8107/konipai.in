import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Global script loading state to prevent multiple script loads
let googleMapsScriptLoaded = false;
let googleMapsScriptLoading = false;
let googleMapsLoadCallbacks: (() => void)[] = [];

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => void;
  defaultValue?: string;
  error?: string;
}

export function AddressAutocomplete({ onAddressSelect, defaultValue = '', error }: AddressAutocompleteProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const autocompleteInput = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);

  // Function to load Google Maps script
  const loadGoogleMapsScript = (callback: () => void) => {
    // If already loaded, call callback immediately
    if (googleMapsScriptLoaded) {
      callback();
      return;
    }
    
    // Add callback to queue
    googleMapsLoadCallbacks.push(callback);
    
    // If already loading, wait for completion
    if (googleMapsScriptLoading) {
      return;
    }
    
    // Start loading
    googleMapsScriptLoading = true;
    
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDwLXGIw4fEOt3kZtbVPn_bpaLi3i9GDBo&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      googleMapsScriptLoaded = true;
      googleMapsScriptLoading = false;
      
      // Execute all callbacks
      while (googleMapsLoadCallbacks.length > 0) {
        const cb = googleMapsLoadCallbacks.shift();
        if (cb) cb();
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      googleMapsScriptLoading = false;
      googleMapsLoadCallbacks = [];
    };
    
    document.head.appendChild(script);
  };
  
  // Initialize autocomplete only when input is focused
  const initializeAutocomplete = () => {
    if (isInitialized || !googleMapsScriptLoaded || !autocompleteInput.current) return;
    
    try {
      autocomplete.current = new google.maps.places.Autocomplete(autocompleteInput.current, {
        componentRestrictions: { country: 'IN' },
        fields: ['address_components', 'formatted_address'],
        types: ['address']
      });
      
      autocomplete.current.addListener('place_changed', () => {
        const place = autocomplete.current?.getPlace();
        if (place?.address_components) {
          let streetNumber = '';
          let route = '';
          let city = '';
          let state = '';
          let postalCode = '';
          let country = '';
          
          place.address_components.forEach((component) => {
            const types = component.types;
            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            } else if (types.includes('route')) {
              route = component.long_name;
            } else if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name;
            } else if (types.includes('country')) {
              country = component.long_name;
            }
          });
          
          const street = `${streetNumber} ${route}`.trim();
          setInputValue(place.formatted_address || '');
          
          onAddressSelect({
            street,
            city,
            state,
            postalCode,
            country
          });
        }
      });
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing Google Maps Autocomplete:', error);
    }
  };
  
  // Handle input focus - load Google Maps only when user interacts with the field
  const handleInputFocus = () => {
    setIsFocused(true);
    
    if (!scriptLoaded) {
      loadGoogleMapsScript(() => {
        setScriptLoaded(true);
        initializeAutocomplete();
      });
    } else if (!isInitialized) {
      initializeAutocomplete();
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autocomplete.current && googleMapsScriptLoaded) {
        google.maps.event.clearInstanceListeners(autocomplete.current);
        autocomplete.current = null;
      }
    };
  }, []);
  
  // Initialize when script is loaded and input is focused
  useEffect(() => {
    if (scriptLoaded && isFocused && !isInitialized) {
      initializeAutocomplete();
    }
  }, [scriptLoaded, isFocused, isInitialized]);



  return (
    <div className="grid gap-2">
      <Label htmlFor="address">Street Address</Label>
      <Input
        ref={autocompleteInput}
        type="text"
        id="address"
        placeholder="Start typing your address..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={handleInputFocus}
        className={error ? "border-red-500" : ""}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <p className="text-sm text-muted-foreground">
        {!isInitialized && isFocused ? "Loading address suggestions..." : "Start typing and select your address from the dropdown"}
      </p>
    </div>
  );
} 