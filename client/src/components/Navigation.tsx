import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu as MenuIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CartDrawer } from "./CartDrawer";
import { useState } from "react";

export function Navigation() {
  const [location] = useLocation();
  const items = useCart((state) => state.items);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
            <span className="text-2xl">🍕</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Slice & Dash
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/">
            <span className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
              location === "/" ? "text-primary" : "text-muted-foreground"
            }`}>
              Menu
            </span>
          </Link>
          <CartDrawer>
            <Button variant="default" className="relative px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">
                  {itemCount}
                </span>
              )}
            </Button>
          </CartDrawer>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-4">
          <CartDrawer>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </Button>
          </CartDrawer>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-6 mt-10">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="text-lg font-medium">Menu</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
