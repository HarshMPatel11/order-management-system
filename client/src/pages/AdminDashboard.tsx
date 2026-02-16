import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MenuItem, OrderWithItems, PromoCode } from '@shared/schema';

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Redirect if not admin
  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  // Fetch data
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/dashboard', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['menu'],
    queryFn: async () => {
      const res = await fetch('/api/menu');
      if (!res.ok) throw new Error('Failed to fetch menu');
      return res.json();
    },
  });

  const { data: orders = [] } = useQuery<OrderWithItems[]>({
    queryKey: ['all-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  const { data: promoCodes = [] } = useQuery<PromoCode[]>({
    queryKey: ['promoCodes'],
    queryFn: async () => {
      const res = await fetch('/api/promo-codes', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch promo codes');
      return res.json();
    },
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update order');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      toast({ title: 'Order status updated' });
    },
  });

  // Create/Update menu item mutation
  const saveMenuItem = useMutation({
    mutationFn: async (data: any) => {
      const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save menu item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      setIsMenuDialogOpen(false);
      setEditingItem(null);
      toast({ title: editingItem ? 'Menu item updated' : 'Menu item created' });
    },
  });

  // Delete menu item mutation
  const deleteMenuItem = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete menu item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast({ title: 'Menu item deleted' });
    },
  });

  // Create promo code mutation
  const createPromoCode = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create promo code');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
      setIsPromoDialogOpen(false);
      toast({ title: 'Promo code created' });
    },
  });

  const handleMenuSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseInt(formData.get('price') as string),
      imageUrl: formData.get('imageUrl'),
      category: formData.get('category'),
      isAvailable: formData.get('isAvailable') === 'true',
    };
    saveMenuItem.mutate(data);
  };

  const handlePromoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get('code'),
      discountType: formData.get('discountType'),
      discountValue: parseInt(formData.get('discountValue') as string),
      minimumOrder: parseInt(formData.get('minimumOrder') as string) || 0,
      maxUses: formData.get('maxUses') ? parseInt(formData.get('maxUses') as string) : undefined,
      expiresAt: formData.get('expiresAt') || undefined,
    };
    createPromoCode.mutate(data);
  };

  const statusColors: Record<string, string> = {
    received: 'bg-blue-500',
    preparing: 'bg-yellow-500',
    out_for_delivery: 'bg-purple-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your restaurant operations</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="menu">Menu Management</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="promos">Promo Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${((analytics?.totalRevenue || 0) / 100).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{menuItems.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Promos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {promoCodes.filter(p => p.isActive).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.ordersByStatus && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(analytics.ordersByStatus).map(([status, count]) => ({
                    status: status.replace('_', ' '),
                    count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.popularItems?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span>{item.name}</span>
                    <Badge>{item.orderCount} orders</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Menu Items</CardTitle>
                <CardDescription>Manage your menu items</CardDescription>
              </div>
              <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingItem(null)}>Add Menu Item</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleMenuSubmit}>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? 'Edit' : 'Add'} Menu Item</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" defaultValue={editingItem?.name} required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" defaultValue={editingItem?.description} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="price">Price (cents)</Label>
                          <Input id="price" name="price" type="number" defaultValue={editingItem?.price} required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Input id="category" name="category" defaultValue={editingItem?.category} required />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input id="imageUrl" name="imageUrl" defaultValue={editingItem?.imageUrl} required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="isAvailable">Availability</Label>
                        <Select name="isAvailable" defaultValue={editingItem?.isAvailable ? 'true' : 'false'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Available</SelectItem>
                            <SelectItem value="false">Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">{editingItem ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>${((item.price || 0) / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        {item.averageRating ? `${item.averageRating} (${item.totalReviews})` : 'No reviews'}
                      </TableCell>
                      <TableCell>{item.orderCount || 0}</TableCell>
                      <TableCell>
                        <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingItem(item);
                            setIsMenuDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMenuItem.mutate(item.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Manage and track all orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>${((order.finalAmount || order.totalAmount) / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus.mutate({ orderId: order.id, status: value })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Promo Codes</CardTitle>
                <CardDescription>Manage promotional codes</CardDescription>
              </div>
              <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Create Promo Code</Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handlePromoSubmit}>
                    <DialogHeader>
                      <DialogTitle>Create Promo Code</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="code">Code</Label>
                        <Input id="code" name="code" placeholder="SUMMER20" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="discountType">Type</Label>
                          <Select name="discountType" defaultValue="percentage">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="discountValue">Value</Label>
                          <Input id="discountValue" name="discountValue" type="number" required />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="minimumOrder">Minimum Order (cents)</Label>
                        <Input id="minimumOrder" name="minimumOrder" type="number" defaultValue="0" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="maxUses">Max Uses (optional)</Label>
                        <Input id="maxUses" name="maxUses" type="number" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="expiresAt">Expires At (optional)</Label>
                        <Input id="expiresAt" name="expiresAt" type="datetime-local" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Min Order</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                      <TableCell>
                        {promo.discountType === 'percentage'
                          ? `${promo.discountValue}%`
                          : `$${(promo.discountValue / 100).toFixed(2)}`}
                      </TableCell>
                      <TableCell>${((promo.minimumOrder || 0) / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        {promo.usedCount} {promo.maxUses ? `/ ${promo.maxUses}` : ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                          {promo.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
