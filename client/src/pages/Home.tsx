import { useMenuItems } from "@/hooks/use-menu";
import { MenuCard } from "@/components/MenuCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["All", "Pizza", "Burger", "Drinks", "Desserts"];

export default function Home() {
  const { data: menuItems, isLoading, error } = useMenuItems();
  const [activeCategory, setActiveCategory] = useState("All");

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Failed to load menu</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  const filteredItems = menuItems?.filter(
    (item) => activeCategory === "All" || item.category === activeCategory
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background pt-16 pb-12 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 text-foreground tracking-tight">
            Delicious Food, <br />
            <span className="text-primary">Delivered to You.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance">
            Choose from our selection of premium dishes made with fresh ingredients and love.
          </p>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className="rounded-full px-6 transition-all"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-64 w-full rounded-3xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems?.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
