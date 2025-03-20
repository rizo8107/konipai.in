import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { updateProfile, uploadAvatar, type Address } from "@/lib/pocketbase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link } from "react-router-dom"
import { pocketbase } from "@/lib/pocketbase"
import { getPocketBaseImageUrl } from "@/utils/imageOptimizer"

export default function ProfilePage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = pocketbase.authStore.model?.id;
        if (!userId) return;

        console.log('Profile page: Fetching addresses for user ID:', userId);
        
        // Only fetch addresses
        const addressesData = await pocketbase.collection('addresses')
          .getList(1, 100, { filter: `user='${userId}'` });
        
        setAddresses(addressesData.items as unknown as Address[]);
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, []); 

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateProfile({ name, phone })
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await uploadAvatar(file)
      toast({
        title: "Success",
        description: "Avatar updated successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload avatar.",
      })
    }
  }

  return (
    <div className="container py-10">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="konipai-tabs-list">
          <TabsTrigger value="profile" className="konipai-tab">Profile</TabsTrigger>
          <TabsTrigger value="addresses" className="konipai-tab">Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  {user?.avatar ? (
                    <AvatarImage 
                      src={`${import.meta.env.VITE_POCKETBASE_URL || 'https://backend-pocketbase.7za6uc.easypanel.host'}/api/files/users/${user.id}/${user.avatar}`} 
                      alt={user.name || 'User avatar'}
                    />
                  ) : (
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a new profile picture
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>

              <Button asChild variant="outline" className="mt-2">
                <Link to="/orders">View My Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
              <CardDescription>
                Manage your saved addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <p className="text-muted-foreground">No addresses found</p>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            {address.street}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.country}
                          </p>
                        </div>
                        {address.isDefault && (
                          <span className="text-sm text-blue-600 dark:text-blue-400">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}