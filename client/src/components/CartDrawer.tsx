import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export function CartDrawer({ children }: { children: React.ReactNode }) {
  const { items, updateQuantity, removeItem, total } = useCart();
  const [, setLocation] = useLocation();

  const handleCheckout = () => {
    setLocation("/checkout");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your Order</SheetTitle>
        </SheetHeader>

        <div className="flex-1 mt-8 overflow-hidden relative">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground p-8">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🛒</span>
              </div>
              <p className="text-lg font-medium text-foreground">Your cart is empty</p>
              <p>Looks like you haven't added any delicious items yet.</p>
              <SheetClose asChild>
                <Button variant="outline" className="mt-4">
                  Browse Menu
                </Button>
              </SheetClose>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg bg-muted"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold line-clamp-1">{item.name}</h4>
                        <span className="font-medium text-primary">
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        ${(item.price / 100).toFixed(2)} each
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 border rounded-md p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-4 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="mt-auto border-t pt-6">
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${(total() / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>$2.99</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${((total() + 299) / 100).toFixed(2)}</span>
                </div>
              </div>
              <SheetClose asChild>
                <Button 
                  className="w-full py-6 text-lg shadow-lg shadow-primary/25" 
                  onClick={handleCheckout}
                >
                  Checkout <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
