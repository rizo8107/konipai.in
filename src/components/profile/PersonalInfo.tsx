import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { pocketbase } from '@/lib/pocketbase';
import { useAuth } from "@/contexts/AuthContext";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Country codes for phone selection
const countryCodes = [
  { code: '1', country: 'US/Canada' },
  { code: '44', country: 'UK' },
  { code: '91', country: 'India' },
  // Add more as needed
];

// Form validation schema
const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

// Phone form schema
const phoneFormSchema = z.object({
  countryCode: z.string(),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
});

export default function PersonalInfo() {
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  
  // Initialize form with user data
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Phone form
  const phoneForm = useForm<z.infer<typeof phoneFormSchema>>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      countryCode: '1',
      phoneNumber: '',
    },
  });

  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        email: user.email || '',
      });

      // Parse phone number if exists
      if (user.phone && user.phone.startsWith('+')) {
        const match = user.phone.match(/^\+(\d+)(\d+)$/);
        if (match) {
          phoneForm.reset({
            countryCode: match[1],
            phoneNumber: match[2],
          });
        }
      }
    }
  }, [user, profileForm, phoneForm]);

  // Function to refresh user data
  const refreshUserData = async () => {
    try {
      if (pocketbase.authStore.isValid && user?.id) {
        await pocketbase.collection('users').getOne(user.id);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      await pocketbase.collection('users').update(user.id, {
        name: values.name,
        email: values.email
      });
      
      toast.success("Profile updated successfully");
      await refreshUserData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const onPhoneSubmit = async (values: z.infer<typeof phoneFormSchema>) => {
    if (!user?.id) return;

    try {
      setPhoneLoading(true);
      
      // Format the complete phone number for PocketBase
      const formattedPhone = `+${values.countryCode}${values.phoneNumber}`;
      
      await pocketbase.collection('users').update(user.id, {
        phone: formattedPhone
      });
      
      toast.success("Phone number updated successfully");
      await refreshUserData();
      setShowPhoneForm(false);
    } catch (error: any) {
      console.error("Error updating phone:", error);
      toast.error(error.message || "Failed to update phone number");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleRemovePhone = async () => {
    if (!user?.id) return;

    try {
      setPhoneLoading(true);
      
      await pocketbase.collection('users').update(user.id, {
        phone: ""
      });
      
      toast.success("Phone number removed successfully");
      await refreshUserData();
    } catch (error: any) {
      console.error("Error removing phone:", error);
      toast.error("Failed to remove phone number");
    } finally {
      setPhoneLoading(false);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24">
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                            <Input className="pl-10" placeholder="Your full name" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                            <Input className="pl-10" placeholder="Your email" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phone Number</CardTitle>
          <CardDescription>
            Update your phone number for enhanced security and account recovery
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPhoneForm && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{user?.phone || 'No phone number added'}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPhoneForm(true)}>
                  {user?.phone ? 'Update' : 'Add Phone'}
                </Button>
                {user?.phone && (
                  <Button variant="destructive" onClick={handleRemovePhone} disabled={phoneLoading}>
                    {phoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {showPhoneForm && (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                <div className="flex gap-2">
                  <FormField
                    control={phoneForm.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <select
                            className="w-full p-2 border border-gray-200 rounded-md"
                            {...field}
                          >
                            {countryCodes.map(country => (
                              <option key={country.code} value={country.code}>
                                +{country.code} {country.country}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={phoneForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={phoneLoading}>
                    {phoneLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Phone
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowPhoneForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 