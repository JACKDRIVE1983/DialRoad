import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, AlertCircle, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StarRating } from './StarRating';
import { 
  hasReviewedCenter, 
  markCenterReviewed, 
  hasLikedComment, 
  markCommentLiked 
} from '@/lib/deviceStorage';

interface Comment {
  id: string;
  author_name: string;
  comment_text: string;
  rating: number;
  likes: number;
  created_at: string;
}

interface CenterCommentsProps {
  centerId: string;
  onRatingUpdate?: (averageRating: number, totalReviews: number) => void;
}

// Simple sanitization to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// Format date as DD/MM/YYYY
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export function CenterComments({ centerId, onRatingUpdate }: CenterCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  // Calculate and report rating updates
  const calculateRating = useCallback((commentsList: Comment[]) => {
    if (commentsList.length === 0) {
      onRatingUpdate?.(0, 0);
      return;
    }
    const total = commentsList.reduce((sum, c) => sum + c.rating, 0);
    const average = total / commentsList.length;
    onRatingUpdate?.(average, commentsList.length);
  }, [onRatingUpdate]);

  // Fetch comments for this center
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('anonymous_comments')
        .select('*')
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
      } else {
        const fetchedComments = (data || []) as Comment[];
        setComments(fetchedComments);
        calculateRating(fetchedComments);
      }
      setIsLoading(false);
    };

    // Check if device already reviewed this center
    setHasReviewed(hasReviewedCenter(centerId));

    // Load liked comments from localStorage
    const loadedLikes = new Set<string>();
    comments.forEach(c => {
      if (hasLikedComment(c.id)) {
        loadedLikes.add(c.id);
      }
    });
    setLikedComments(loadedLikes);

    fetchComments();
  }, [centerId, calculateRating]);

  // Update liked comments when comments list changes
  useEffect(() => {
    const loadedLikes = new Set<string>();
    comments.forEach(c => {
      if (hasLikedComment(c.id)) {
        loadedLikes.add(c.id);
      }
    });
    setLikedComments(loadedLikes);
  }, [comments]);

  // Validation
  const isNameValid = name.trim().length >= 3;
  const isCommentValid = commentText.trim().length >= 10;
  const isRatingValid = rating >= 1 && rating <= 5;
  const canSubmit = isNameValid && isCommentValid && isRatingValid && !isSubmitting && !hasReviewed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    setIsSubmitting(true);

    const sanitizedName = sanitizeInput(name);
    const sanitizedComment = sanitizeInput(commentText);

    const { data, error } = await supabase
      .from('anonymous_comments')
      .insert({
        center_id: centerId,
        author_name: sanitizedName,
        comment_text: sanitizedComment,
        rating: rating,
        likes: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting comment:', error);
      toast.error('Errore nell\'invio della recensione');
    } else if (data) {
      // Mark as reviewed on this device
      markCenterReviewed(centerId);
      setHasReviewed(true);
      
      // Add new comment to the list (newest first)
      const newComments = [data as Comment, ...comments];
      setComments(newComments);
      calculateRating(newComments);
      
      setName('');
      setCommentText('');
      setRating(0);
      toast.success('Recensione pubblicata');
    }

    setIsSubmitting(false);
  };

  const handleLike = async (commentId: string) => {
    // Check if already liked
    if (hasLikedComment(commentId)) {
      toast.info('Hai già messo mi piace a questo commento');
      return;
    }

    // Optimistically update UI
    setLikedComments(prev => new Set([...prev, commentId]));
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    ));

    // Update in database
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const { error } = await supabase
      .from('anonymous_comments')
      .update({ likes: comment.likes + 1 })
      .eq('id', commentId);

    if (error) {
      console.error('Error liking comment:', error);
      // Revert optimistic update
      setLikedComments(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, likes: c.likes - 1 } : c
      ));
      toast.error('Errore nel mettere mi piace');
    } else {
      // Mark as liked in localStorage
      markCommentLiked(commentId);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-border/50">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        Recensioni ({comments.length})
      </h3>

      {/* Review Form */}
      {hasReviewed ? (
        <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-sm text-foreground">
            ✓ Hai già lasciato una recensione per questo centro.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          {/* Star Rating */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              La tua valutazione *
            </label>
            <StarRating 
              rating={rating} 
              onRatingChange={setRating} 
              size="lg"
            />
            {rating === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Seleziona da 1 a 5 stelle
              </p>
            )}
          </div>

          <div>
            <Input
              placeholder="Il tuo nome *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="bg-background/50 border-border/50"
            />
            {name.length > 0 && !isNameValid && (
              <p className="text-xs text-destructive mt-1">Minimo 3 caratteri</p>
            )}
          </div>
          
          <div>
            <Textarea
              placeholder="Scrivi la tua recensione... *"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
              rows={3}
              className="bg-background/50 border-border/50 resize-none"
            />
            {commentText.length > 0 && !isCommentValid && (
              <p className="text-xs text-destructive mt-1">Minimo 10 caratteri</p>
            )}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/30">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Il nome sarà visibile pubblicamente. Le recensioni sono pubbliche e non verificate. Non condividere informazioni mediche sensibili.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={!canSubmit}
            className="w-full"
          >
            {isSubmitting ? (
              'Invio in corso...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Pubblica Recensione
              </>
            )}
          </Button>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Caricamento recensioni...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nessuna recensione ancora. Sii il primo!
          </p>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id}
              className="p-4 rounded-xl bg-muted/30 border border-border/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    {comment.author_name}
                  </span>
                  <StarRating rating={comment.rating} readonly size="sm" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap mb-3">
                {comment.comment_text}
              </p>
              
              {/* Like button */}
              <button
                onClick={() => handleLike(comment.id)}
                disabled={likedComments.has(comment.id)}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  likedComments.has(comment.id)
                    ? 'text-primary cursor-default'
                    : 'text-muted-foreground hover:text-primary cursor-pointer'
                }`}
              >
                <ThumbsUp 
                  className={`w-4 h-4 ${likedComments.has(comment.id) ? 'fill-primary' : ''}`} 
                />
                <span>{comment.likes}</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
