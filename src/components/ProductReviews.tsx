import { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageSquare, Image as ImageIcon, X, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { 
  getProductReviews, 
  createReview, 
  addReviewComment, 
  voteReview,
  type Review 
} from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ProductReviewsProps {
  productId: string;
  initialReviewCount?: number;
}

export const ProductReviews = ({ productId, initialReviewCount = 0 }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    loadReviews();
  }, [productId]);
  
  const loadReviews = async () => {
    try {
      const data = await getProductReviews(productId);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reviews. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedImages.length > 5) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You can upload a maximum of 5 images.",
      });
      return;
    }
    
    setSelectedImages(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };
  
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please Login",
        description: "You need to be logged in to submit a review.",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      await createReview(
        productId,
        rating,
        title,
        content,
        selectedImages
      );
      
      // Reset form
      setRating(5);
      setTitle('');
      setContent('');
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setShowReviewForm(false);
      
      // Reload reviews
      await loadReviews();
      
      toast({
        title: "Review Submitted",
        description: "Thank you for your review!",
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit review. Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleAddComment = async (reviewId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please Login",
        description: "You need to be logged in to add a comment.",
      });
      return;
    }
    
    try {
      await addReviewComment(reviewId, commentContent);
      setCommentContent('');
      setActiveCommentId(null);
      await loadReviews();
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add comment. Please try again later.",
      });
    }
  };
  
  const handleVote = async (reviewId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please Login",
        description: "You need to be logged in to vote.",
      });
      return;
    }
    
    try {
      await voteReview(reviewId);
      await loadReviews();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to register vote. Please try again later.",
      });
    }
  };
  
  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0;
  
  return (
    <div className="mt-16" id="reviews">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        <Button onClick={() => setShowReviewForm(true)}>Write a Review</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-2">
              {Array(5).fill(null).map((_, i) => (
                <Star 
                  key={i} 
                  className={cn(
                    "h-5 w-5",
                    i < Math.round(averageRating) ? "fill-current" : ""
                  )} 
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Based on {reviews.length} reviews
            </div>
          </div>
          
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter(r => r.rating === rating).length;
              const percentage = (count / reviews.length) * 100 || 0;
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-6">{rating}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1 text-yellow-400">
                  {Array(5).fill(null).map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "h-4 w-4",
                        i < review.rating ? "fill-current" : "text-gray-300"
                      )} 
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(review.created), 'MMM d, yyyy')}
                </span>
              </div>
              
              <p className="text-muted-foreground mb-4">{review.content}</p>
              
              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {review.images.map((image, index) => (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <button className="shrink-0">
                          <img 
                            src={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/reviews/${review.id}/${image}`}
                            alt={`Review image ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <img 
                          src={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/reviews/${review.id}/${image}`}
                          alt={`Review image ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{review.expand?.user?.name || 'Anonymous'}</span>
                  {review.verified_purchase && (
                    <Badge variant="secondary">Verified Purchase</Badge>
                  )}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleVote(review.id)}
                  className="text-sm"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Helpful ({review.helpful_votes})
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveCommentId(review.id)}
                  className="text-sm"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Comment
                </Button>
              </div>
              
              {/* Comments Section */}
              {review.expand?.comments && review.expand.comments.length > 0 && (
                <div className="pl-6 border-l space-y-4 mb-4">
                  {review.expand.comments.map((comment) => (
                    <div key={comment.id} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {comment.expand?.user?.name || 'Anonymous'}
                        </span>
                        <span className="text-muted-foreground">
                          {format(new Date(comment.created), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Comment Form */}
              {activeCommentId === review.id && (
                <div className="flex gap-2">
                  <Input
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleAddComment(review.id)}
                    disabled={!commentContent.trim()}
                  >
                    Post
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitReview} className="space-y-6">
            <div>
              <Label>Rating</Label>
              <div className="flex items-center gap-1 text-yellow-400">
                {Array(5).fill(null).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={cn(
                        "h-8 w-8",
                        i < rating ? "fill-current" : ""
                      )} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="content">Review</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your experience with this product"
                required
                rows={4}
              />
            </div>
            
            <div>
              <Label>Photos</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {selectedImages.length < 5 && (
                  <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      multiple
                    />
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </label>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                You can upload up to 5 images
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !content.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 