import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Models } from 'appwrite';
import { account } from '@/lib/appwrite';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Mail, Phone, Loader2 } from 'lucide-react';

// Define country codes for phone numbers
const countryCodes = [
  { code: '+1', country: 'US/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'India' },
  { code: '+61', country: 'Australia' },
  { code: '+86', country: 'China' },
  { code: '+33', country: 'France' },
  { code: '+49', country: 'Germany' },
  { code: '+81', country: 'Japan' },
  { code: '+65', country: 'Singapore' },
  { code: '+971', country: 'UAE' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+55', country: 'Brazil' },
  { code: '+52', country: 'Mexico' },
  { code: '+27', country: 'South Africa' },
  { code: '+82', country: 'South Korea' },
  { code: '+7', country: 'Russia' },
  { code: '+39', country: 'Italy' },
  { code: '+34', country: 'Spain' },
  { code: '+31', country: 'Netherlands' },
  { code: '+90', country: 'Turkey' },
].sort((a, b) => a.country.localeCompare(b.country));

// Phone number validation regex: must contain only digits
const phoneRegex = /^\d{10}$/;

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  countryCode: z.string().min(2, 'Country code is required'),
  phoneNumber: z.string()
    .regex(phoneRegex, 'Phone number must be exactly 10 digits')
    .optional()
    .or(z.literal(''))
});

// Define the type for our form
type FormValues = z.infer<typeof formSchema>;

interface PersonalInfoProps {
  user: Models.User<Models.Preferences>;
}

export default function PersonalInfo({ user }: PersonalInfoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  
  // Parse existing phone number if available
  const parsePhoneNumber = () => {
    if (!user.phone) return { countryCode: '+91', phoneNumber: '' };
    
    // Find the country code from the list that matches the start of the phone
    const foundCode = countryCodes.find(cc => 
      user.phone?.startsWith(cc.code)
    );
    
    if (foundCode) {
      return {
        countryCode: foundCode.code,
        phoneNumber: user.phone.substring(foundCode.code.length)
      };
    }
    
    // Default fallback
    return { countryCode: '+91', phoneNumber: '' };
  };
  
  const { countryCode, phoneNumber } = parsePhoneNumber();

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      countryCode: countryCode,
      phoneNumber: phoneNumber,
      password: '',
    },
  });

  // Handle form submission
  async function onSubmit(values: FormValues) {
    console.log('Form submitted with values:', values);
    try {
      setIsLoading(true);
      
      // Update name if changed
      if (values.name !== user.name) {
        console.log('Updating name from', user.name, 'to', values.name);
        await account.updateName(values.name);
      }

      // Update phone if changed
      const fullPhoneNumber = values.phoneNumber ? `${values.countryCode}${values.phoneNumber}` : '';
      console.log('Current phone:', user.phone, 'New phone:', fullPhoneNumber);
      
      if (fullPhoneNumber !== user.phone && values.phoneNumber) {
        console.log('Phone number changed, updating...');
        
        // Ensure the phone number is exactly 10 digits
        if (!phoneRegex.test(values.phoneNumber)) {
          console.log('Phone validation failed:', values.phoneNumber);
          toast.error('Phone number must be exactly 10 digits');
          setIsLoading(false);
          return;
        }
        
        // If we're showing the password field but no password is provided, return early
        if (showPasswordField && !values.password) {
          console.log('Password field is shown but no password provided');
          toast.error('Password is required to update phone number');
          setIsLoading(false);
          return;
        }
        
        // Ensure country code starts with +
        const formattedCountryCode = values.countryCode.startsWith('+') 
          ? values.countryCode 
          : `+${values.countryCode}`;
        
        // Format the complete phone number for Appwrite
        const fullFormattedPhone = `${formattedCountryCode}${values.phoneNumber}`;
        
        console.log('Attempting to update phone with:', {
          fullPhone: fullFormattedPhone,
          passwordProvided: !!values.password
        });
        
        try {
          // Try to update phone with the provided password
          if (values.password) {
            await account.updatePhone(fullFormattedPhone, values.password);
            toast.success('Phone number updated successfully');
            setShowPasswordField(false);
          } else {
            // If no password provided and we're not showing the password field yet,
            // this will likely fail and we'll show the password field
            await account.updatePhone(fullFormattedPhone, '');
            toast.success('Phone number updated successfully');
          }
        } catch (error: any) {
          console.error('Phone update error:', error);
          
          // If the error is related to authentication, show the password field
          if (error.message.includes('Invalid credentials') || 
              error.message.includes('password') || 
              error.code === 401) {
            console.log('Password required for phone update');
            setShowPasswordField(true);
            setIsLoading(false);
            return;
          }
          
          // For other errors, show the error message
          if (error.message.includes('Phone number must')) {
            toast.error('Phone format error: Number must be exactly 10 digits');
          } else if (error.message.includes('verification')) {
            toast.error('Phone verification required. Check your phone for a verification code.');
          } else {
            toast.error(error.message || 'Failed to update phone number');
          }
          
          setIsLoading(false);
          return;
        }
      } else if (!values.phoneNumber && user.phone) {
        // If phone is empty and there was a previous phone number
        toast.error('Phone number removal is not supported by Appwrite');
      }

      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-8">Personal Information</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input 
                      placeholder="Enter your full name" 
                      className="h-10 pl-10 rounded-md bg-white border-gray-200 focus:border-primary focus:ring-primary" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel className="text-sm font-medium text-gray-700">Phone Number (optional)</FormLabel>
            <div className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem className="w-[120px] flex-shrink-0">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-md bg-white border-gray-200">
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {countryCodes.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.code} ({country.country})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <Input 
                          type="tel" 
                          placeholder="10-digit number" 
                          className="h-10 pl-10 rounded-md bg-white border-gray-200 focus:border-primary focus:ring-primary"
                          maxLength={10}
                          onKeyPress={(e) => {
                            // Allow only digits
                            if (!/\d/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Phone number must be exactly 10 digits without spaces or special characters
            </p>
          </div>

          {showPasswordField && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter your password to update phone" 
                      className="h-10 rounded-md bg-white border-gray-200 focus:border-primary focus:ring-primary"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                  <p className="text-xs text-gray-500 mt-1">
                    Your password is required to update your phone number
                  </p>
                </FormItem>
              )}
            />
          )}

          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center pt-2">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="h-10 bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
            <div className="flex items-center text-sm text-gray-500">
              <Mail className="h-4 w-4 mr-2" />
              <span>{user.email}</span>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
} 