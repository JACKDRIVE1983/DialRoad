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
}

// Transform raw JSON data to DialysisCenter format
const rawCenters = centersData as RawCenter[];

export const mockCenters: DialysisCenter[] = rawCenters
  .filter(center => center.geocode_status === 'OK' && center.lat && center.lng)
  .map(center => ({
    id: center.id,
    name: center.name,
    address: center.address,
    city: center.city,
    province: center.province,
    region: center.region.charAt(0) + center.region.slice(1).toLowerCase(), // Capitalize properly
    phone: center.phone,
    email: center.email,
    coordinates: {
      lat: center.lat,
      lng: center.lng
    },
    services: ['Emodialisi'], // Default service, can be expanded
    rating: 4.0 + Math.random() * 0.9, // Random rating between 4.0-4.9
    likes: Math.floor(Math.random() * 200) + 10,
    comments: [],
    openingHours: 'Lun-Sab: 6:00-20:00',
    isOpen: true
  }));

// Extract unique regions from the data
const uniqueRegions = [...new Set(rawCenters.map(c => 
  c.region.charAt(0) + c.region.slice(1).toLowerCase()
))].sort();

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
