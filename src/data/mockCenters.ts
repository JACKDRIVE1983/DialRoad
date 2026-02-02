import centersData from './centri_dialisi.json';

export interface RawCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  region: string;
  phone: string;
  email: string | null;
  lat: number;
  lng: number;
  geocode_status: string;
  ai_responses?: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  likes: number;
}

export interface DialysisCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  region: string;
  phone: string;
  email: string | null;
  coordinates: {
    lat: number;
    lng: number;
  };
  services: string[];
  rating: number;
  likes: number;
  comments: Comment[];
  imageUrl?: string;
  openingHours: string;
  isOpen: boolean;
  aiResponses?: string[];
}

// Helper function to capitalize region name safely
const capitalizeRegion = (region: string | null): string => {
  if (!region) return 'Sconosciuta';
  return region.charAt(0).toUpperCase() + region.slice(1).toLowerCase();
};

// Transform raw JSON data to DialysisCenter format
const rawCenters = centersData as RawCenter[];

// Filter and deduplicate centers by ID
const seenIds = new Set<string>();
export const mockCenters: DialysisCenter[] = rawCenters
  .filter(center => {
    if (!center.geocode_status || center.geocode_status !== 'OK') return false;
    if (!center.lat || !center.lng || !center.region) return false;
    if (seenIds.has(center.id)) return false;
    seenIds.add(center.id);
    return true;
  })
  .map((center, index) => ({
    id: center.id || `center-${index}`,
    name: center.name || 'Centro Dialisi',
    address: center.address || '',
    city: center.city || '',
    province: center.province || '',
    region: capitalizeRegion(center.region),
    phone: center.phone || '',
    email: center.email,
    coordinates: {
      lat: center.lat,
      lng: center.lng
    },
    services: ['Emodialisi'],
    rating: 0, // Real ratings come from database
    likes: 0, // Real favorites come from database
    comments: [],
    openingHours: 'Lun-Sab: 6:00-20:00',
    isOpen: true,
    aiResponses: center.ai_responses || []
  }));

// Extract unique regions from the data (filtering out null values)
const uniqueRegions = [...new Set(
  rawCenters
    .filter(c => c.region)
    .map(c => capitalizeRegion(c.region))
)].sort();

export const regions = ['Tutte le Regioni', ...uniqueRegions];

export const serviceTypes = [
  'Emodialisi',
  'Dialisi Peritoneale',
  'Dialisi Domiciliare',
  'Dialisi Vacanza',
  'Nefrologia',
  'Emergenze 24h',
  'Trapianto Renale',
  'Telemedicina',
  'Supporto Psicologico',
  'Consulenza Nutrizionale'
];
