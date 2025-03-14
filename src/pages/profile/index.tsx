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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin" />
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
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-white border-b">
            <TabsTrigger 
              value="personal-info" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Personal Info
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger 
              value="addresses"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Addresses
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
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