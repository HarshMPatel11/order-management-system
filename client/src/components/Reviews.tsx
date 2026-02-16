import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Review } from '@shared/schema';

interface ReviewsProps {
  menuItemId: number;
}

export function Reviews({ menuItemId }: ReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', menuItemId],
    queryFn: async () => {
      const res = await fetch(`/api/menu/${menuItemId}/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
  });

  const createReview = useMutation({
    mutationFn: async (data: { menuItemId: number; rating: number; comment?: string }) => {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create review');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', menuItemId] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      setRating(0);
      setComment('');
      toast({ title: 'Review submitted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to submit review', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }
    createReview.mutate({ menuItemId, rating, comment: comment || undefined });
  };

  const StarRating = ({ value, interactive = false, size = 'default' }: { value: number; interactive?: boolean; size?: 'default' | 'large' }) => {
    const sizeClass = size === 'large' ? 'h-8 w-8' : 'h-5 w-5';
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= (interactive ? (hoveredRating || value) : value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer' : ''}`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Reviews ({reviews.length})</h3>
        
        {user && (
          <Card className="p-4 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Rating</label>
                <StarRating value={rating} interactive size="large" />
              </div>
              
              <div>
                <Textarea
                  placeholder="Share your experience (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button type="submit" disabled={createReview.isPending}>
                {createReview.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </Card>
        )}

        {!user && (
          <p className="text-sm text-muted-foreground mb-6">
            Please sign in to leave a review
          </p>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((review: any) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {review.user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {review.user?.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <StarRating value={review.rating} />
                    </div>
                    
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
