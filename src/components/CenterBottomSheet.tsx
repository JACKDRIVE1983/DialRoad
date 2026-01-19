import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  X, Phone, Navigation, Heart, Star, Clock, 
  MapPin, Send, ChevronUp, Share2, Trash2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useReviews, Review } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import centerImage from '@/assets/center-placeholder.jpg';

export function CenterBottomSheet() {
  const navigate = useNavigate();
  const { selectedCenter, setSelectedCenter } = useApp();
  const { user, isAuthenticated, profile } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { reviews, isLoading: reviewsLoading, addReview, deleteReview, getAverageRating } = useReviews(selectedCenter?.id);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(5);
  const dragControls = useDragControls();

  const isCurrentFavorite = selectedCenter ? isFavorite(selectedCenter.id) : false;
  const averageRating = getAverageRating();

  const handleClose = () => {
    setSelectedCenter(null);
    setIsExpanded(false);
    setNewReviewText('');
    setNewRating(5);
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Accedi per salvare i preferiti');
      navigate('/auth');
      return;
    }
    
    if (selectedCenter) {
      const { error } = await toggleFavorite(selectedCenter.id);
      if (error) {
        toast.error('Errore nel salvare il preferito');
      } else {
        toast.success(isCurrentFavorite ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti');
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Accedi per lasciare una recensione');
      navigate('/auth');
      return;
    }

    if (selectedCenter && newReviewText.trim()) {
      const { error } = await addReview(selectedCenter.id, newRating, newReviewText.trim());
      if (error) {
        toast.error('Errore nel salvare la recensione');
      } else {
        toast.success('Recensione pubblicata!');
        setNewReviewText('');
        setNewRating(5);
      }
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (selectedCenter) {
      const { error } = await deleteReview(reviewId, selectedCenter.id);
      if (error) {
        toast.error('Errore nell\'eliminare la recensione');
      } else {
        toast.success('Recensione eliminata');
      }
    }
  };

  const handleCall = () => {
    if (selectedCenter) {
      window.open(`tel:${selectedCenter.phone}`, '_self');
    }
  };

  const handleNavigate = () => {
    if (!selectedCenter) return;
    const { lat, lng } = selectedCenter.coordinates;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (!selectedCenter) return;
    const shareData = {
      title: selectedCenter.name,
      text: `Centro Dialisi: ${selectedCenter.name} - ${selectedCenter.address}`,
      url: window.location.href
    };
    
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(`${selectedCenter.name} - ${selectedCenter.address}`);
      toast.success('Copiato negli appunti');
    }
  };

  const renderStars = (rating: number, interactive = false, size = 'w-4 h-4') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setNewRating(star)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          >
            <Star 
              className={`${size} ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} 
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {selectedCenter && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-background/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 glass-panel rounded-t-[2rem] max-h-[90vh] overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                handleClose();
              } else if (info.offset.y < -50) {
                setIsExpanded(true);
              }
            }}
          >
            {/* Handle */}
            <div 
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Content */}
            <div className={`overflow-y-auto ${isExpanded ? 'max-h-[85vh]' : 'max-h-[60vh]'} scrollbar-hide transition-all duration-300`}>
              {/* Header with image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={centerImage} 
                  alt={selectedCenter.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full glass-card flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>

                {/* Expand indicator */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="absolute top-4 left-4 w-10 h-10 rounded-full glass-card flex items-center justify-center"
                >
                  <ChevronUp className={`w-5 h-5 text-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Status badge */}
                <div className="absolute bottom-4 left-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    selectedCenter.isOpen 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {selectedCenter.isOpen ? 'Aperto' : 'Chiuso'}
                  </span>
                </div>
              </div>

              {/* Center info */}
              <div className="px-6 pb-6">
                {/* Title and rating */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                      {selectedCenter.name}
                    </h2>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{selectedCenter.city}, {selectedCenter.region}</span>
                    </div>
                  </div>
                  <div className="flex items-center bg-muted px-3 py-1.5 rounded-xl">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                    <span className="font-semibold text-foreground">{averageRating || selectedCenter.rating}</span>
                    <span className="text-xs text-muted-foreground ml-1">({reviews.length})</span>
                  </div>
                </div>

                {/* Address and hours */}
                <div className="space-y-2 mb-6">
                  <p className="text-sm text-muted-foreground">{selectedCenter.address}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    {selectedCenter.openingHours}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <Button
                    onClick={handleCall}
                    className="flex flex-col items-center py-4 h-auto glass-button border-none"
                    variant="ghost"
                  >
                    <Phone className="w-5 h-5 mb-1 text-primary" />
                    <span className="text-xs text-foreground">Chiama</span>
                  </Button>
                  <Button
                    onClick={handleNavigate}
                    className="flex flex-col items-center py-4 h-auto glass-button border-none"
                    variant="ghost"
                  >
                    <Navigation className="w-5 h-5 mb-1 text-primary" />
                    <span className="text-xs text-foreground">Naviga</span>
                  </Button>
                  <Button
                    onClick={handleToggleFavorite}
                    className={`flex flex-col items-center py-4 h-auto glass-button border-none ${isCurrentFavorite ? 'bg-red-500/10' : ''}`}
                    variant="ghost"
                  >
                    <Heart className={`w-5 h-5 mb-1 ${isCurrentFavorite ? 'text-red-500 fill-red-500' : 'text-primary'}`} />
                    <span className="text-xs text-foreground">{isCurrentFavorite ? 'Salvato' : 'Salva'}</span>
                  </Button>
                  <Button
                    onClick={handleShare}
                    className="flex flex-col items-center py-4 h-auto glass-button border-none"
                    variant="ghost"
                  >
                    <Share2 className="w-5 h-5 mb-1 text-primary" />
                    <span className="text-xs text-foreground">Condividi</span>
                  </Button>
                </div>

                {/* Services */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Servizi Offerti</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCenter.services.map((service) => (
                      <span 
                        key={service}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reviews section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center">
                      <Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500" />
                      Recensioni ({reviews.length})
                    </h3>
                  </div>

                  {/* Add review box - prominent */}
                  <motion.div 
                    className="glass-card rounded-2xl p-5 mb-6 border-2 border-primary/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Lascia una recensione
                    </h4>
                    
                    {/* Star rating */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm text-muted-foreground">Valutazione:</span>
                      {renderStars(newRating, true, 'w-6 h-6')}
                      <span className="text-sm font-medium text-foreground">({newRating}/5)</span>
                    </div>
                    
                    {/* Review text */}
                    <div className="mb-4">
                      <textarea
                        placeholder={isAuthenticated ? "Racconta la tua esperienza in questo centro..." : "Accedi per lasciare una recensione..."}
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        disabled={!isAuthenticated}
                        rows={3}
                        className="w-full px-4 py-3 bg-muted/50 rounded-xl border border-border/50 outline-none text-foreground placeholder:text-muted-foreground text-sm resize-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    
                    {/* Submit button */}
                    <Button
                      onClick={handleSubmitReview}
                      disabled={!newReviewText.trim() || !isAuthenticated}
                      className="w-full gradient-bg text-primary-foreground disabled:opacity-50 rounded-xl py-3"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isAuthenticated ? 'Pubblica Recensione' : 'Accedi per recensire'}
                    </Button>
                  </motion.div>

                  {/* Reviews list */}
                  <div className="space-y-4 pb-safe-area-bottom">
                    {reviews.map((review) => (
                      <motion.div
                        key={review.id}
                        className="glass-card p-4 rounded-xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-semibold text-sm overflow-hidden">
                            {review.user_avatar ? (
                              <img src={review.user_avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              review.user_name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground text-sm">{review.user_name}</span>
                                {renderStars(review.rating)}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString('it-IT')}
                                </span>
                                {user?.id === review.user_id && (
                                  <button
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="text-destructive hover:text-destructive/80 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.text}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {reviews.length === 0 && !reviewsLoading && (
                      <div className="text-center py-8">
                        <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">
                          Nessuna recensione ancora. Sii il primo!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
