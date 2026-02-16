import { useMyOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, Redirect } from "wouter";
import { Package, Eye, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const STATUS_CONFIG = {
  received: { label: "Received", variant: "secondary" as const },
  preparing: { label: "Preparing", variant: "default" as const },
  out_for_delivery: { label: "Out for Delivery", variant: "default" as const },
  delivered: { label: "Delivered", variant: "default" as const },
  cancelled: { label: "Cancelled", variant: "destructive" as const },
};

export default function OrderHistory() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useMyOrders();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (ordersLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="bg-background border-b py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-display text-3xl font-bold mb-2">Order History</h1>
          <p className="text-muted-foreground">
            View and track all your orders
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {!orders || orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start ordering delicious food from our menu!
                </p>
                <Button asChild>
                  <Link href="/">Browse Menu</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.received;
              const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        <p className="text-sm text-muted-foreground">{orderDate}</p>
                      </div>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Items Preview */}
                    <div className="space-y-2">
                      {order.items?.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">
                              {item.quantity}x
                            </span>
                            <span>{item.menuItem?.name || "Item"}</span>
                          </div>
                          <span className="text-muted-foreground">
                            ${((item.price * item.quantity) / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.items && order.items.length > 3 && (
                        <p className="text-xs text-muted-foreground pl-6">
                          + {order.items.length - 3} more items
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Order Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deliver to</span>
                        <span className="font-medium">{order.customerName}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="text-green-600 font-medium">
                            -${(order.discountAmount / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">
                          ${((order.finalAmount || order.totalAmount) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/order/${order.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </Button>
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <Button asChild className="flex-1">
                          <Link href={`/order/${order.id}`}>Track Order</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
