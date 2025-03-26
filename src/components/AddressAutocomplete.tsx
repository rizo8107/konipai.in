import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const autocompleteInput = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Load Google Maps JavaScript API script
    if (!document.querySelector('#google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDwLXGIw4fEOt3kZtbVPn_bpaLi3i9GDBo&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }

    return () => {
      // Cleanup if needed
      const script = document.querySelector('#google-maps-script');
      if (script) {
        // Don't remove the script as it might be used by other components
        // Just cleanup our autocomplete instance
        if (autocomplete.current) {
          google.maps.event.clearInstanceListeners(autocomplete.current);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (scriptLoaded && autocompleteInput.current) {
      // Initialize Google Maps Places Autocomplete
      autocomplete.current = new google.maps.places.Autocomplete(autocompleteInput.current, {
        componentRestrictions: { country: 'IN' }, // Restrict to India
        fields: ['address_components', 'formatted_address'],
        types: ['address']
      });

      // Add listener for place selection
      autocomplete.current.addListener('place_changed', () => {
        const place = autocomplete.current?.getPlace();
        if (place?.address_components) {
          let streetNumber = '';
          let route = '';
          let city = '';
          let state = '';
          let postalCode = '';
          let country = '';

          // Extract address components
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

          // Combine street number and route for street address
          const street = `${streetNumber} ${route}`.trim();

          // Update input value with formatted address
          setInputValue(place.formatted_address || '');

          // Call the callback with parsed address
          onAddressSelect({
            street,
            city,
            state,
            postalCode,
            country
          });
        }
      });
    }
  }, [scriptLoaded, onAddressSelect]);

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
        className={error ? "border-red-500" : ""}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <p className="text-sm text-muted-foreground">
        Start typing and select your address from the dropdown
      </p>
    </div>
  );
} 