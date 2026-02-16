import { MenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Star, Eye } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { motion } from "framer-motion";
import { Reviews } from "./Reviews";

export function MenuCard({ item }: { item: MenuItem }) {
  const addItem = useCart((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    addItem(item);
    setTimeout(() => setIsAdding(false), 300);
  };

  const rating = item.averageRating ? parseFloat(item.averageRating.toString()) : 0;
  const reviewCount = item.totalReviews || 0;

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
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <p className="text-white font-medium text-sm line-clamp-2">
            {item.description}
          </p>
        </div>
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold">
              Unavailable
            </span>
          </div>
        )}
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
        
        {rating > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {rating.toFixed(1)} ({reviewCount})
            </span>
          </div>
        )}
        
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10">
          {item.description}
        </p>

        <div className="flex gap-2">
          <Button 
            onClick={handleAdd}
            className={`flex-1 rounded-xl transition-all duration-300 ${isAdding ? 'scale-95 bg-green-500 hover:bg-green-600' : ''}`}
            size="lg"
            disabled={!item.isAvailable}
          >
            {isAdding ? (
              "Added!"
            ) : (
              <>
                Add <Plus className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
          
          <Dialog open={reviewsOpen} onOpenChange={setReviewsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="rounded-xl" aria-label="View reviews">
                <Eye className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{item.name} - Reviews</DialogTitle>
              </DialogHeader>
              <Reviews menuItemId={item.id} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.div>
  );
}
