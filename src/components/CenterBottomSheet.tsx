import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  X, Phone, Navigation, Heart, MessageCircle, Star, Clock, 
  MapPin, Send, ChevronUp, Share2, Copy
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import centerImage from '@/assets/center-placeholder.jpg';

export function CenterBottomSheet() {
  const { selectedCenter, setSelectedCenter, toggleLike, addComment } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const dragControls = useDragControls();

  const handleClose = () => {
    setSelectedCenter(null);
    setIsExpanded(false);
    setNewComment('');
  };

  const handleLike = () => {
    if (selectedCenter && !isLiked) {
      toggleLike(selectedCenter.id);
      setIsLiked(true);
    }
  };

  const handleSubmitComment = () => {
    if (selectedCenter && newComment.trim()) {
      addComment(selectedCenter.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleCall = () => {
    if (selectedCenter) {
      window.open(`tel:${selectedCenter.phone}`, '_self');
    }
  };

  const handleNavigate = async () => {
    if (!selectedCenter) return;

    const { lat, lng } = selectedCenter.coordinates;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    // In iframe/preview environments, navigation to Google is blocked.
    // Best UX: copy the link and notify the user.
    try {
      await navigator.clipboard.writeText(mapsUrl);
      toast.success('Link copiato!', {
        description: 'Incolla il link in un nuovo tab per aprire Google Maps.',
        duration: 5000,
        action: {
          label: 'Apri',
          onClick: () => window.open(mapsUrl, '_blank'),
        },
      });
    } catch {
      // Fallback if clipboard API fails
      toast.info('Copia questo link:', {
        description: mapsUrl,
        duration: 10000,
      });
    }
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
                    <span className="font-semibold text-foreground">{selectedCenter.rating}</span>
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
                    onClick={handleLike}
                    className={`flex flex-col items-center py-4 h-auto glass-button border-none ${isLiked ? 'bg-red-500/10' : ''}`}
                    variant="ghost"
                  >
                    <Heart className={`w-5 h-5 mb-1 ${isLiked ? 'text-red-500 fill-red-500' : 'text-primary'}`} />
                    <span className="text-xs text-foreground">{selectedCenter.likes + (isLiked ? 1 : 0)}</span>
                  </Button>
                  <Button
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

                {/* Comments section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Commenti ({selectedCenter.comments.length})
                    </h3>
                  </div>

                  {/* Add comment */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 glass-card rounded-xl overflow-hidden">
                      <input
                        type="text"
                        placeholder="Scrivi un commento..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                        className="w-full px-4 py-3 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim()}
                      size="icon"
                      className="w-11 h-11 rounded-xl gradient-bg text-primary-foreground disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Comments list */}
                  <div className="space-y-4 pb-safe-area-bottom">
                    {selectedCenter.comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        className="glass-card p-4 rounded-xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-semibold text-sm">
                            {comment.userName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-foreground text-sm">{comment.userName}</span>
                              <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.text}</p>
                            <button className="flex items-center mt-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                              <Heart className="w-3 h-3 mr-1" />
                              {comment.likes}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {selectedCenter.comments.length === 0 && (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">
                          Nessun commento ancora. Sii il primo!
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
