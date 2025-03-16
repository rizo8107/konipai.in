import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import PersonalInfo from '@/components/profile/PersonalInfo';
import OrderHistory from '@/components/profile/OrderHistory';
import AddressBook from '@/components/profile/AddressBook';
import SecuritySettings from '@/components/profile/SecuritySettings';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('personal-info');
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ProfilePage: useEffect triggered, loading:', loading, 'user:', user ? 'exists' : 'null');
    
    const initializePage = async () => {
      try {
        setPageLoading(true);
        setError(null);
        
        // Wait a short time to ensure auth state is fully initialized
        if (loading) {
          console.log('ProfilePage: Auth is still loading, waiting...');
          return; // Exit and wait for next render when loading is complete
        }

        if (!user) {
          console.log('ProfilePage: No user found, redirecting to login');
          navigate('/auth/login');
          return;
        }
        
        console.log('ProfilePage: User is authenticated, loading profile data');
        // Any additional initialization can happen here
      } catch (err) {
        console.error('ProfilePage: Error initializing page:', err);
        setError('Failed to load profile data. Please try refreshing the page.');
      } finally {
        setPageLoading(false);
      }
    };

    initializePage();
  }, [user, loading, navigate]);

  useEffect(() => {
    console.log('ProfilePage: Page loading state:', pageLoading);
  }, [pageLoading]);

  if (loading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#219898]" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 mb-4 text-lg">Error</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#219898] text-white rounded hover:bg-[#219898]/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="konipai-container py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">My Account</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px] konipai-tabs-list">
            <TabsTrigger 
              value="personal-info" 
              className="konipai-tab"
            >
              Personal Info
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="konipai-tab"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger 
              value="addresses"
              className="konipai-tab"
            >
              Addresses
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="konipai-tab"
            >
              Security
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="personal-info">
              <Card className="border-0">
                <PersonalInfo user={user} />
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="border-0">
                <OrderHistory />
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card className="border-0">
                <AddressBook />
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="border-0">
                <SecuritySettings />
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
} 