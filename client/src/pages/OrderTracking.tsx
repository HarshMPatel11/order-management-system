import { useOrder, useCancelOrder } from "@/hooks/use-orders";
import { useRoute } from "wouter";
import { Check, Clock, Package, Truck, ArrowLeft, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const STATUS_STEPS = [
  { id: "received", label: "Order Received", icon: Clock },
  { id: "preparing", label: "Preparing", icon: Package },
  { id: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { id: "delivered", label: "Delivered", icon: Check },
];

export default function OrderTracking() {
  const [, params] = useRoute("/order/:id");
  const orderId = Number(params?.id);
  const { data: order, isLoading } = useOrder(orderId);
  const cancelOrder = useCancelOrder();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-destructive">Order Not Found</h1>
        <Button asChild className="mt-4">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.id === order.status);
  const isCancelled = order.status === "cancelled";

  const handleCancelOrder = async () => {
    await cancelOrder.mutateAsync(orderId);
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="bg-background border-b py-8 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="font-display text-3xl font-bold">Order #{order.id}</h1>
            {isCancelled && (
              <Badge variant="destructive" className="ml-2">
                Cancelled
              </Badge>
            )}
          </div>
          {!isCancelled && (
            <p className="text-muted-foreground">
              Estimated Delivery: <span className="text-foreground font-semibold">30-45 mins</span>
            </p>
          )}
          {isCancelled && (
            <p className="text-destructive font-medium">
              This order has been cancelled
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
        {/* Status Timeline */}
        {!isCancelled ? (
          <Card className="border-border/50 shadow-lg shadow-black/5">
            <CardContent className="p-8">
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-0">
                {/* Progress Bar Background */}
                <div className="absolute top-8 left-4 bottom-4 w-0.5 bg-muted md:w-full md:h-0.5 md:top-6 md:left-0 -z-10" />
                
                {/* Progress Bar Active */}
                <motion.div 
                  className="absolute top-8 left-4 w-0.5 bg-primary origin-top md:h-0.5 md:w-full md:top-6 md:left-0 md:origin-left -z-10"
                  initial={{ scaleY: 0, scaleX: 0 }}
                  animate={{ 
                    scaleY: window.innerWidth < 768 ? (currentStepIndex / (STATUS_STEPS.length - 1)) : 1,
                    scaleX: window.innerWidth >= 768 ? (currentStepIndex / (STATUS_STEPS.length - 1)) : 1
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />

                {STATUS_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.id} className="flex md:flex-col items-center gap-4 md:gap-2 bg-background md:bg-transparent p-2 md:p-0 w-full md:w-auto z-10">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left md:text-center">
                        <p className={`font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full animate-pulse">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-4">
                <X className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-destructive mb-2">Order Cancelled</h3>
              <p className="text-muted-foreground">
                Your order has been cancelled and you will receive a refund if applicable.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Deliver to</p>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-foreground/80">{order.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{order.phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order?.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className="bg-muted px-2 py-1 rounded text-xs font-bold">
                        {item.quantity}x
                      </span>
                      <span>{item.menuItem?.name || "Item"}</span>
                    </div>
                    <span className="text-muted-foreground">
                      ${((item.price * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total Paid</span>
                  <span className="text-primary">${(order.totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Order More Food
            </Link>
          </Button>

          {order.canCancel && !isCancelled && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" disabled={cancelOrder.isPending}>
                  <X className="mr-2 h-4 w-4" />
                  {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Your order will be cancelled and you will receive a refund
                    if applicable.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, keep my order</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, cancel order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
