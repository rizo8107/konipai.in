import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { countries } from '@/lib/countries';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, Loader2, MapPin, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// Define the collection ID
const ADDRESSES_COLLECTION_ID = 'addresses';

// Define the Address interface
interface Address {
  $id: string;
  userId: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  $createdAt: string;
  $updatedAt: string;
}

const addressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(4, 'Valid ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
  isDefault: z.boolean().default(false),
});

export default function AddressBook() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India', // Default to India
      isDefault: false,
    },
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  useEffect(() => {
    if (editingAddress) {
      form.reset({
        name: editingAddress.name,
        street: editingAddress.street,
        city: editingAddress.city,
        state: editingAddress.state,
        zipCode: editingAddress.zipCode,
        country: editingAddress.country,
        isDefault: editingAddress.isDefault,
      });
    }
  }, [editingAddress, form]);

  async function fetchAddresses() {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Fetching addresses for user:', user.$id);
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        ADDRESSES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );
      
      console.log('Addresses fetched successfully:', response.documents.length);
      setAddresses(response.documents as unknown as Address[]);
    } catch (error: any) {
      console.error('Failed to fetch addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof addressSchema>) {
    if (!user) {
      toast.error('You must be logged in to manage addresses');
      return;
    }
    
    try {
      const addressData = {
        ...values,
        userId: user.$id,
      };
      
      if (editingAddress) {
        console.log('Updating address:', editingAddress.$id, addressData);
        
        await databases.updateDocument(
          DATABASE_ID,
          ADDRESSES_COLLECTION_ID,
          editingAddress.$id,
          addressData
        );
        
        if (values.isDefault) {
          await setDefaultAddress(user.$id, editingAddress.$id);
        }
        
        toast.success('Address updated successfully');
      } else {
        console.log('Creating new address:', addressData);
        
        const newAddress = await databases.createDocument(
          DATABASE_ID,
          ADDRESSES_COLLECTION_ID,
          ID.unique(),
          addressData
        );
        
        if (values.isDefault) {
          await setDefaultAddress(user.$id, newAddress.$id);
        }
        
        toast.success('Address added successfully');
      }
      
      setIsAddDialogOpen(false);
      setEditingAddress(null);
      form.reset();
      fetchAddresses();
    } catch (error: any) {
      console.error('Failed to save address:', error);
      toast.error(error.message || 'Failed to save address');
    }
  }

  async function setDefaultAddress(userId: string, addressId: string) {
    try {
      console.log('Setting default address:', addressId);
      
      // First, remove default from all addresses
      const allAddresses = await databases.listDocuments(
        DATABASE_ID,
        ADDRESSES_COLLECTION_ID,
        [Query.equal('userId', userId), Query.equal('isDefault', true)]
      );
      
      await Promise.all(
        allAddresses.documents
          .filter((addr: any) => addr.$id !== addressId)
          .map((addr: any) => 
            databases.updateDocument(
              DATABASE_ID,
              ADDRESSES_COLLECTION_ID,
              addr.$id,
              { isDefault: false }
            )
          )
      );
      
      // Set the new default address
      return databases.updateDocument(
        DATABASE_ID,
        ADDRESSES_COLLECTION_ID,
        addressId,
        { isDefault: true }
      );
    } catch (error) {
      console.error('Failed to set default address:', error);
      throw error;
    }
  }

  async function deleteAddress(addressId: string) {
    try {
      console.log('Deleting address:', addressId);
      
      await databases.deleteDocument(
        DATABASE_ID,
        ADDRESSES_COLLECTION_ID,
        addressId
      );
      
      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch (error: any) {
      console.error('Failed to delete address:', error);
      toast.error(error.message || 'Failed to delete address');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-medium text-foreground">Address Book</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Address Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Home, Office, etc." 
                          {...field} 
                          className="h-10 rounded-md bg-white" 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Street Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123 Main St" 
                          {...field} 
                          className="h-10 rounded-md bg-white"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">City</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-10 rounded-md bg-white" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">State</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-10 rounded-md bg-white" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-10 rounded-md bg-white" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Country</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-md bg-white">
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px] bg-white">
                            {countries.map((country) => (
                              <SelectItem key={country.code} value={country.name}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Set as default address
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-10 mt-6"
                >
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-muted-foreground/20 rounded-lg bg-muted/10">
          <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4 text-center">No addresses saved yet</p>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Your First Address</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div
              key={address.$id}
              className="border border-border rounded-lg p-5 relative transition-all hover:shadow-md"
            >
              {address.isDefault && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                  <Check className="h-3 w-3" />
                  <span>Default</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{address.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {address.street}<br />
                    {address.city}, {address.state} {address.zipCode}<br />
                    {address.country}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs gap-1.5"
                      onClick={() => {
                        setEditingAddress(address);
                        setIsAddDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => deleteAddress(address.$id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 