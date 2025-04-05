import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

export interface CheckoutFormData {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string; // Ensuring phone field is included as per memory
}

interface CheckoutFormProps {
  formData: CheckoutFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: { [key: string]: string | null };
  onAddressSelect: (address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => void;
}

export function CheckoutForm({ 
  formData, 
  onChange, 
  errors, 
  onAddressSelect 
}: CheckoutFormProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Contact Information</h2>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={onChange}
            placeholder="Your full name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <FormError>{errors.name}</FormError>}
        </div>
        
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onChange}
            placeholder="Your email address"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <FormError>{errors.email}</FormError>}
        </div>
        
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={onChange}
            placeholder="Your phone number"
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <FormError>{errors.phone}</FormError>}
        </div>
      </div>
      
      <h2 className="text-xl font-semibold pt-4">Shipping Address</h2>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="address">Address Search</Label>
          <AddressAutocomplete onAddressSelect={onAddressSelect} />
        </div>
        
        <div>
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={onChange}
            placeholder="Street address"
            className={errors.address ? 'border-red-500' : ''}
          />
          {errors.address && <FormError>{errors.address}</FormError>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={onChange}
              placeholder="City"
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && <FormError>{errors.city}</FormError>}
          </div>
          
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              type="text"
              value={formData.state}
              onChange={onChange}
              placeholder="State"
              className={errors.state ? 'border-red-500' : ''}
            />
            {errors.state && <FormError>{errors.state}</FormError>}
          </div>
        </div>
        
        <div>
          <Label htmlFor="zipCode">ZIP / Postal Code</Label>
          <Input
            id="zipCode"
            name="zipCode"
            type="text"
            value={formData.zipCode}
            onChange={onChange}
            placeholder="ZIP / Postal code"
            className={errors.zipCode ? 'border-red-500' : ''}
          />
          {errors.zipCode && <FormError>{errors.zipCode}</FormError>}
        </div>
      </div>
    </div>
  );
}
