import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { updateProfile, uploadAvatar, type Address } from "@/lib/pocketbase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link } from "react-router-dom"
import { pocketbase } from "@/lib/pocketbase"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Check, AlertTriangle, Package, Loader2, ShoppingBag } from "lucide-react"
import { format } from "date-fns"

// Define types for orders
interface OrderItem {
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
  };
  quantity: number;
  color?: string;
}

interface Order {
  id: string;
  created: string;
  user: string;
  products: string | OrderItem[];
  subtotal: number;
  total: number;
  shipping_cost: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_address: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_id?: string;
  payment_order_id?: string;
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [loading, setLoading] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const { toast } = useToast()

  // Fetch orders when the orders tab is selected
  const fetchOrders = async () => {
    if (!user?.id) return;
    
    setOrdersLoading(true);
    try {
      const ordersList = await pocketbase.collection('orders').getList(1, 5, {
        filter: `user="${user.id}"`,
        sort: '-created',
      });
      setOrders(ordersList.items as unknown as Order[]);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch addresses for now
        const addressesData = await pocketbase.collection('addresses')
          .getList(1, 100, { filter: `user="${user?.id}"` });
        
        setAddresses(addressesData.items as unknown as Address[]);
        
        // Fetch orders as well
        fetchOrders();
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [user?.id])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateProfile({ name })
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

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'outline';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Package className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="container py-10">
      <Tabs defaultValue="profile" className="space-y-4" onValueChange={(value) => {
        if (value === 'orders') {
          fetchOrders();
        }
      }}>
        <TabsList className="konipai-tabs-list">
          <TabsTrigger value="profile" className="konipai-tab">Profile</TabsTrigger>
          <TabsTrigger value="orders" className="konipai-tab">Orders</TabsTrigger>
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
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
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

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                View your recent order history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No Orders Yet</p>
                  <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                  <Button asChild>
                    <Link to="/shop">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => {
                    // Parse products data
                    let products: OrderItem[] = [];
                    try {
                      if (typeof order.products === 'string') {
                        products = JSON.parse(order.products);
                      } else {
                        products = order.products as OrderItem[];
                      }
                    } catch (err) {
                      products = [];
                    }

                    const orderDate = new Date(order.created);
                    
                    return (
                      <Card key={order.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 py-3">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                Order #{order.id}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {format(orderDate, 'PPP')}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusBadgeVariant(order.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(order.status)}
                                  {getStatusLabel(order.status)}
                                </span>
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-3">
                          <div className="space-y-2">
                            {products.slice(0, 2).map((item, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium text-sm">{item.product.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Qty: {item.quantity}
                                    </div>
                                  </div>
                                </div>
                                <div className="font-medium text-sm">
                                  ₹{(item.product.price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            ))}
                            {products.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{products.length - 2} more items
                              </div>
                            )}
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-medium text-sm">
                            <span>Total</span>
                            <span>₹{parseFloat(order.total.toString()).toFixed(2)}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 py-2">
                          <Button asChild variant="secondary" size="sm" className="ml-auto">
                            <Link to={`/order-confirmation/${order.id}`}>View Details</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/10 flex justify-center">
              <Button asChild variant="outline">
                <Link to="/orders">View All Orders</Link>
              </Button>
            </CardFooter>
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