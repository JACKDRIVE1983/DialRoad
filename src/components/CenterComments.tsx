import { useState, useEffect } from 'react';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Comment {
  id: string;
  author_name: string;
  comment_text: string;
  created_at: string;
}

interface CenterCommentsProps {
  centerId: string;
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

export function CenterComments({ centerId }: CenterCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setComments(data || []);
      }
      setIsLoading(false);
    };

    fetchComments();
  }, [centerId]);

  // Validation
  const isNameValid = name.trim().length >= 3;
  const isCommentValid = commentText.trim().length >= 10;
  const canSubmit = isNameValid && isCommentValid && !isSubmitting;

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
        comment_text: sanitizedComment
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting comment:', error);
      toast.error('Errore nell\'invio del commento');
    } else if (data) {
      // Add new comment to the list (newest first)
      setComments(prev => [data, ...prev]);
      setName('');
      setCommentText('');
      toast.success('Commento pubblicato');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="mt-6 pt-6 border-t border-border/50">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        Commenti ({comments.length})
      </h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
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
            placeholder="Scrivi il tuo commento... *"
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
            Il nome sarà visibile pubblicamente. I commenti sono pubblici e non verificati. Non condividere informazioni mediche sensibili.
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
              Pubblica Commento
            </>
          )}
        </Button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Caricamento commenti...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nessun commento ancora. Sii il primo!
          </p>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id}
              className="p-4 rounded-xl bg-muted/30 border border-border/30"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-foreground">
                  {comment.author_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                {comment.comment_text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
