import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  X, Phone, Navigation, Clock, 
  MapPin, ChevronUp, Share2
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { calculateDistance, formatDistance } from '@/lib/distance';
import centerImage from '@/assets/center-placeholder.jpg';
import { CenterComments } from './CenterComments';
import { CenterRatingSummary } from './CenterRatingSummary';

export function CenterBottomSheet() {
  const { selectedCenter, setSelectedCenter, userLocation } = useApp();
  
  // Rating state from comments
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const handleRatingUpdate = useCallback((avg: number, total: number) => {
    setAverageRating(avg);
    setTotalReviews(total);
  }, []);
  
  // Calculate distance to selected center
  const distance = useMemo(() => {
    if (!userLocation || !selectedCenter) return null;
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      selectedCenter.coordinates.lat,
      selectedCenter.coordinates.lng
    );
  }, [userLocation, selectedCenter]);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const dragControls = useDragControls();

  const handleClose = () => {
    setSelectedCenter(null);
    setIsExpanded(false);
  };

  const handleCall = () => {
    if (selectedCenter) {
      // Extract only the main phone number (before any "/" or other separators)
      const mainPhone = selectedCenter.phone.split('/')[0].trim();
      // Remove any non-numeric characters except + at the start
      const cleanPhone = mainPhone.replace(/[^\d+]/g, '');
      window.open(`tel:${cleanPhone}`, '_self');
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
                {/* Title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                      {selectedCenter.name}
                    </h2>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{selectedCenter.city}, {selectedCenter.region}</span>
                    </div>
                    {distance !== null && (
                      <div className="flex items-center text-primary text-sm font-medium mt-1">
                        <Navigation className="w-4 h-4 mr-1" />
                        {formatDistance(distance)} da te
                      </div>
                    )}
                    <div className="mt-2">
                      <CenterRatingSummary 
                        averageRating={averageRating} 
                        totalReviews={totalReviews} 
                      />
                    </div>
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
                <div className="grid grid-cols-3 gap-3 mb-6">
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
                    onClick={handleShare}
                    className="flex flex-col items-center py-4 h-auto glass-button border-none"
                    variant="ghost"
                  >
                    <Share2 className="w-5 h-5 mb-1 text-primary" />
                    <span className="text-xs text-foreground">Condividi</span>
                  </Button>
                </div>

                {/* Services */}
                <div>
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

                {/* Comments Section */}
                <div className="pb-safe-area-bottom">
                  <CenterComments 
                    centerId={selectedCenter.id} 
                    onRatingUpdate={handleRatingUpdate}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
