import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/hooks/use-cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";

// Form schema matching backend requirement partially
const checkoutFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Please enter a valid address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { mutateAsync: createOrder, isPending } = useCreateOrder();
  const [, setLocation] = useLocation();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      address: "",
      phone: "",
    },
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      const order = await createOrder({
        ...data,
        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
      });
      clearCart();
      setLocation(`/order/${order.id}`);
    } catch (error) {
      // Error is handled by mutation hook via toast
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button onClick={() => setLocation("/")}>Go to Menu</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => setLocation("/")} 
        className="mb-8 pl-0 hover:pl-2 transition-all"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Menu
      </Button>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h1 className="font-display text-3xl font-bold mb-6">Checkout</h1>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} className="h-12 bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} className="h-12 bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Apt 4B" {...field} className="h-12 bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/25 mt-6"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Place Order • $${((total() + 299) / 100).toFixed(2)}`
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold mb-6">Order Summary</h2>
          <Card className="bg-secondary/30 border-none shadow-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-background rounded-md w-8 h-8 flex items-center justify-center font-bold text-sm border">
                        {item.quantity}x
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
                  </div>
                ))}

                <Separator className="bg-border/50" />

                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${(total() / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>$2.99</span>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="flex justify-between items-center font-display font-bold text-xl">
                  <span>Total</span>
                  <span className="text-primary">${((total() + 299) / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
