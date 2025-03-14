import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { toast } from 'sonner';
import { 
  KeyRound, 
  ShieldCheck, 
  LogOut, 
  Loader2,
  Lock,
  AlertCircle
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SecuritySettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    if (!user) {
      toast.error('You must be logged in to update your password');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Updating password for user:', user.$id);
      
      // Update password using Appwrite account API
      await account.updatePassword(
        values.newPassword,
        values.currentPassword
      );
      
      console.log('Password updated successfully');
      toast.success('Password updated successfully');
      form.reset();
    } catch (error: any) {
      console.error('Failed to update password:', error);
      
      // Handle specific error cases
      if (error.code === 401) {
        setError('Current password is incorrect');
        toast.error('Current password is incorrect');
      } else {
        setError(error.message || 'Failed to update password');
        toast.error(error.message || 'Failed to update password');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogoutAllDevices() {
    if (!user) {
      toast.error('You must be logged in to manage sessions');
      return;
    }
    
    try {
      setIsLogoutLoading(true);
      setError(null);
      
      console.log('Logging out from all devices for user:', user.$id);
      
      // Delete all sessions except current one
      await account.deleteSessions();
      
      console.log('Logged out from all other devices successfully');
      toast.success('Logged out from all other devices');
    } catch (error: any) {
      console.error('Failed to logout from other devices:', error);
      setError(error.message || 'Failed to logout from other devices');
      toast.error(error.message || 'Failed to logout from other devices');
    } finally {
      setIsLogoutLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-medium text-gray-900">Security Settings</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2 mt-4">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <Card className="mt-6 border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-gray-900">Change Password</CardTitle>
          </div>
          <CardDescription className="text-gray-500">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Current Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your current password"
                        className="h-10 rounded-md bg-white border-gray-200 focus:border-primary focus:ring-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your new password"
                        className="h-10 rounded-md bg-white border-gray-200 focus:border-primary focus:ring-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your new password"
                        className="h-10 rounded-md bg-white border-gray-200 focus:border-primary focus:ring-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isLoading}
                className="mt-2 bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-6 border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-gray-900">Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription className="text-gray-500">
            Add an extra layer of security to your account by enabling two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-2 border-gray-200 hover:bg-gray-50">
            <ShieldCheck className="h-4 w-4" />
            Enable 2FA
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            Note: Two-factor authentication requires additional setup with Appwrite. 
            Contact your administrator for more information.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6 border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-gray-900">Login Sessions</CardTitle>
          </div>
          <CardDescription className="text-gray-500">
            Manage and revoke access from devices where you're currently logged in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleLogoutAllDevices}
            disabled={isLogoutLoading}
          >
            {isLogoutLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Logout from All Devices
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 