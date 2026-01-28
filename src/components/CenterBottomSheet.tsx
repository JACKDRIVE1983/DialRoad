import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  X, Phone, Navigation, Clock, 
  MapPin, ChevronUp, Share2, Hotel
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { calculateDistance, formatDistance } from '@/lib/distance';
import centerImage from '@/assets/center-placeholder.jpg';
import { CenterComments } from './CenterComments';
import { CenterRatingSummary } from './CenterRatingSummary';
import { Capacitor } from '@capacitor/core';
import { showInterstitialAd } from '@/lib/admob';

const isWebPlatform = () => Capacitor.getPlatform() === 'web';

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

  const handleClose = async () => {
    // Show interstitial ad on close (with rate limiting)
    if (Capacitor.isNativePlatform()) {
      try {
        await showInterstitialAd();
      } catch (error) {
        console.error('Interstitial error:', error);
      }
    }
    
    setSelectedCenter(null);
    setIsExpanded(false);
  };

  const handleCall = () => {
    if (selectedCenter) {
      const mainPhone = selectedCenter.phone.split('/')[0].trim();
      const cleanPhone = mainPhone.replace(/[^\d+]/g, '');
      window.open(`tel:${cleanPhone}`, '_self');
    }
  };

  const handleNavigate = () => {
    if (!selectedCenter) return;
    const { lat, lng } = selectedCenter.coordinates;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    // Keep it simple and avoid in-app webviews
    if (isWebPlatform()) {
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(mapsUrl);
    }
  };

  const bookingHref = useMemo(() => {
    const nomeCentro = selectedCenter?.name?.trim();
    if (!nomeCentro) return '#';
    return (
      'https://www.booking.com/searchresults.html?ss=' +
      encodeURIComponent(nomeCentro) +
      '&aid=2015501'
    );
  }, [selectedCenter?.name]);

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
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 dark:bg-card/95 backdrop-blur-2xl rounded-t-[2rem] max-h-[90vh] overflow-hidden border-t border-x border-white/20 dark:border-white/10"
            style={{
              boxShadow: '0 -10px 60px rgba(0, 0, 0, 0.2), 0 -2px 20px rgba(0, 0, 0, 0.08)'
            }}
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
            {/* Handle - Premium Style */}
            <div 
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Content */}
            <div className={`overflow-y-auto ${isExpanded ? 'max-h-[85vh]' : 'max-h-[65vh]'} scrollbar-hide transition-all duration-300`}>
              {/* Header with image */}
              <div className="relative h-48 overflow-hidden mx-4 rounded-2xl">
                <img 
                  src={centerImage} 
                  alt={selectedCenter.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/50 dark:border-white/20 transition-transform hover:scale-105 active:scale-95"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>

                {/* Expand indicator */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/50 dark:border-white/20 transition-transform hover:scale-105 active:scale-95"
                >
                  <ChevronUp className={`w-4 h-4 text-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Status badge */}
                <div className="absolute bottom-3 left-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md ${
                    selectedCenter.isOpen 
                      ? 'bg-green-500/30 text-white border border-green-400/50' 
                      : 'bg-red-500/30 text-white border border-red-400/50'
                  }`}>
                    {selectedCenter.isOpen ? 'Aperto' : 'Chiuso'}
                  </span>
                </div>
              </div>

              {/* Center info */}
              <div className="px-5 pt-5 pb-6">
                {/* Title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-display font-bold text-foreground mb-1">
                      {selectedCenter.name}
                    </h2>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1.5" />
                      <span className="text-sm">{selectedCenter.city}, {selectedCenter.region}</span>
                    </div>
                    {distance !== null && (
                      <div className="flex items-center text-primary text-sm font-medium mt-1.5">
                        <Navigation className="w-4 h-4 mr-1.5" />
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
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-muted-foreground">{selectedCenter.address}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    {selectedCenter.openingHours}
                  </div>
                </div>

                {/* Booking.com Hotel Search Link (simple <a>) */}
                <a
                  href={bookingHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    const nomeCentro = selectedCenter?.name?.trim();
                    if (!nomeCentro) {
                      e.preventDefault();
                      alert('Errore: nome del centro non disponibile.');
                      return;
                    }
                    console.log('URL Generato:', bookingHref);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 mb-5 rounded-full bg-[#003580] text-white font-semibold text-sm shadow-lg shadow-[#003580]/25 hover:shadow-xl hover:bg-[#00265c] transition-all duration-200 active:scale-[0.98]"
                >
                  <Hotel className="w-5 h-5" />
                  <span>Cerca Hotel Vicini</span>
                </a>

                {/* External open test link */}
                <a
                  href="https://www.google.com"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => console.log('URL Generato (test Google): https://www.google.com')}
                  className="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-full bg-muted text-foreground font-semibold text-sm border border-border/60 hover:bg-muted/80 transition-all duration-200 active:scale-[0.98]"
                >
                  <span>Apri Google (test)</span>
                </a>

                {/* Action buttons - Premium Pill Style */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={handleCall}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Chiama</span>
                  </button>
                  <button
                    onClick={handleNavigate}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full bg-accent text-accent-foreground font-semibold text-sm shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Navigation className="w-5 h-5" />
                    <span>Naviga</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-muted/80 dark:bg-white/10 border border-border/50 dark:border-white/10 text-foreground hover:bg-muted transition-all duration-200 active:scale-95"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Services */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Servizi Offerti</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCenter.services.map((service) => (
                      <span 
                        key={service}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="bg-muted/40 dark:bg-white/5 rounded-2xl p-4 -mx-1 border border-border/30 dark:border-white/5">
                  <div className="pb-safe-area-bottom">
                    <CenterComments 
                      centerId={selectedCenter.id} 
                      onRatingUpdate={handleRatingUpdate}
                    />
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
