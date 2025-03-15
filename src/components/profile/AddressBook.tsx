import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { pocketbase, Collections } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Loader2, Home, Building, GlobeIcon, Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const addressFormSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean().default(false),
});

export default function AddressBook() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof addressFormSchema>>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      isDefault: false,
    },
  });

  const loadAddresses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await pocketbase.collection(Collections.ADDRESSES).getList(1, 50, {
        filter: `user = "${user.id}"`,
      });
      
      setAddresses(response.items as unknown as Address[]);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [user]);

  const onSubmit = async (values: z.infer<typeof addressFormSchema>) => {
    if (!user) return;
    
    try {
      setIsAddingAddress(true);
      
      // If this is marked as default, we need to update other addresses
      if (values.isDefault) {
        // First, update all existing addresses to not be default
        for (const address of addresses) {
          if (address.isDefault) {
            await pocketbase.collection(Collections.ADDRESSES).update(address.id, {
              isDefault: false
            });
          }
        }
      }
      
      // Only set as default if it's the first address or specifically marked
      const shouldBeDefault = values.isDefault || addresses.length === 0;
      
      // Create the new address
      await pocketbase.collection(Collections.ADDRESSES).create({
        user: user.id,
        street: values.street,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: values.country,
        isDefault: shouldBeDefault,
      });
      
      toast.success('Address added successfully');
      form.reset();
      setAddressDialogOpen(false);
      loadAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to add address');
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      setDeletingAddressId(addressId);
      await pocketbase.collection(Collections.ADDRESSES).delete(addressId);
      
      toast.success('Address deleted successfully');
      loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      // First, update all addresses to not be default
      for (const address of addresses) {
        if (address.isDefault) {
          await pocketbase.collection(Collections.ADDRESSES).update(address.id, {
            isDefault: false
          });
        }
      }
      
      // Then set the selected address as default
      await pocketbase.collection(Collections.ADDRESSES).update(addressId, {
        isDefault: true
      });
      
      toast.success('Default address updated');
      loadAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Your Addresses</h2>
        
        <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
              <DialogDescription>
                Enter the details for your new shipping address.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, Apt 4B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            {/* Add more countries as needed */}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Set as default address</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={isAddingAddress}>
                    {isAddingAddress && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Address
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : addresses.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle>No Addresses Yet</CardTitle>
            <CardDescription>
              You haven't added any shipping addresses yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4 pb-8">
            <MapPin className="h-16 w-16 text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              {address.isDefault && (
                <Badge className="absolute top-4 right-4" variant="secondary">
                  Default
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  {address.city}, {address.state}
                </CardTitle>
                <CardDescription>{address.street}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{address.city}, {address.state} {address.postalCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{address.country}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-2">
                {!address.isDefault && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSetDefaultAddress(address.id)}
                  >
                    Set as Default
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteAddress(address.id)}
                  disabled={deletingAddressId === address.id}
                >
                  {deletingAddressId === address.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 