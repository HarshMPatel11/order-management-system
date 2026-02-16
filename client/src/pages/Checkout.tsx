import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/hooks/use-cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Tag, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const checkoutFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Please enter a valid address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  paymentMethod: z.enum(["card", "cash"]),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { mutateAsync: createOrder, isPending } = useCreateOrder();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [promoCode, setPromoCode] = useState("");
  const [promoValidation, setPromoValidation] = useState<any>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      address: "",
      phone: "",
      email: "",
      paymentMethod: "cash",
      notes: "",
    },
  });

  const subtotal = total();
  const deliveryFee = 299; // $2.99
  const discount = promoValidation?.valid ? promoValidation.discount || 0 : 0;
  const finalTotal = subtotal + deliveryFee - discount;

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast({ title: "Please enter a promo code", variant: "destructive" });
      return;
    }

    setIsValidatingPromo(true);
    try {
      const res = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderTotal: subtotal }),
      });
      
      const result = await res.json();
      setPromoValidation(result);
      
      if (result.valid) {
        setAppliedPromo(promoCode);
        toast({ title: result.message });
      } else {
        toast({ title: result.message, variant: "destructive" });
        setPromoCode("");
      }
    } catch (error) {
      toast({ title: "Failed to validate promo code", variant: "destructive" });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const removePromo = () => {
    setPromoCode("");
    setPromoValidation(null);
    setAppliedPromo(null);
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      const order = await createOrder({
        customerName: data.customerName,
        address: data.address,
        phone: data.phone,
        email: data.email && data.email.trim() !== "" ? data.email : undefined,
        paymentMethod: data.paymentMethod,
        notes: data.notes && data.notes.trim() !== "" ? data.notes : undefined,
        promoCode: appliedPromo || undefined,
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="you@example.com" type="email" {...field} className="h-12 bg-background" />
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

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash on Delivery</SelectItem>
                            <SelectItem value="card">Card Payment (Demo)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions (optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Ring doorbell twice" {...field} className="bg-background" />
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
                      `Place Order • $${(finalTotal / 100).toFixed(2)}`
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold mb-6">Order Summary</h2>
          
          {/* Promo Code */}
          <Card className="mb-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 border-primary/20">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">Promo Code</span>
                  </div>
                  {appliedPromo ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="font-mono">
                        {appliedPromo.toUpperCase()}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={removePromo}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && validatePromoCode()}
                        className="h-9"
                      />
                      <Button 
                        onClick={validatePromoCode}
                        disabled={isValidatingPromo}
                        size="sm"
                      >
                        {isValidatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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
                    <span>${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>$2.99</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount</span>
                      <span>-${(discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator className="bg-border/50" />

                <div className="flex justify-between items-center font-display font-bold text-xl">
                  <span>Total</span>
                  <span className="text-primary">${(finalTotal / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
