import { MenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { motion } from "framer-motion";

export function MenuCard({ item }: { item: MenuItem }) {
  const addItem = useCart((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    addItem(item);
    setTimeout(() => setIsAdding(false), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
    >
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <p className="text-white font-medium text-sm line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-1 block">
              {item.category}
            </span>
            <h3 className="font-display font-bold text-xl text-foreground group-hover:text-primary transition-colors">
              {item.name}
            </h3>
          </div>
          <span className="font-display font-bold text-lg text-foreground bg-secondary/50 px-3 py-1 rounded-full">
            ${(item.price / 100).toFixed(2)}
          </span>
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-2 mb-6 h-10">
          {item.description}
        </p>

        <Button 
          onClick={handleAdd}
          className={`w-full rounded-xl transition-all duration-300 ${isAdding ? 'scale-95 bg-green-500 hover:bg-green-600' : ''}`}
          size="lg"
        >
          {isAdding ? (
            "Added!"
          ) : (
            <>
              Add to Cart <Plus className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
