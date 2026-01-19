export interface DialysisCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  phone: string;
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

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  likes: number;
}

export const mockCenters: DialysisCenter[] = [
  {
    id: "1",
    name: "Centro Dialisi Roma Nord",
    address: "Via Flaminia 456",
    city: "Roma",
    region: "Lazio",
    phone: "+39 06 1234567",
    coordinates: { lat: 41.9388, lng: 12.4769 },
    services: ["Emodialisi", "Dialisi Peritoneale", "Nefrologia", "Emergenze 24h"],
    rating: 4.8,
    likes: 234,
    comments: [
      {
        id: "c1",
        userId: "u1",
        userName: "Marco R.",
        text: "Personale eccezionale e struttura modernissima. Mi sono trovato benissimo.",
        createdAt: "2024-01-15",
        likes: 12
      },
      {
        id: "c2",
        userId: "u2",
        userName: "Giulia B.",
        text: "Centro molto pulito e organizzato. Tempi di attesa minimi.",
        createdAt: "2024-01-10",
        likes: 8
      }
    ],
    openingHours: "Lun-Sab: 6:00-22:00",
    isOpen: true
  },
  {
    id: "2",
    name: "Dialisi Milano Centro",
    address: "Corso Buenos Aires 12",
    city: "Milano",
    region: "Lombardia",
    phone: "+39 02 9876543",
    coordinates: { lat: 45.4773, lng: 9.2089 },
    services: ["Emodialisi", "Dialisi Domiciliare", "Consulenza Nutrizionale"],
    rating: 4.6,
    likes: 189,
    comments: [
      {
        id: "c3",
        userId: "u3",
        userName: "Luca M.",
        text: "Ottimo centro, medici molto competenti e disponibili.",
        createdAt: "2024-01-12",
        likes: 15
      }
    ],
    openingHours: "Lun-Ven: 7:00-21:00",
    isOpen: true
  },
  {
    id: "3",
    name: "Centro Nefrologico Napoli",
    address: "Via Toledo 89",
    city: "Napoli",
    region: "Campania",
    phone: "+39 081 5551234",
    coordinates: { lat: 40.8468, lng: 14.2568 },
    services: ["Emodialisi", "Trapianto Renale", "Pediatria Nefrologica"],
    rating: 4.9,
    likes: 312,
    comments: [
      {
        id: "c4",
        userId: "u4",
        userName: "Anna P.",
        text: "Il miglior centro della Campania. Staff incredibile!",
        createdAt: "2024-01-14",
        likes: 22
      }
    ],
    openingHours: "24 ore su 24",
    isOpen: true
  },
  {
    id: "4",
    name: "Dialisi Torino Ovest",
    address: "Corso Francia 234",
    city: "Torino",
    region: "Piemonte",
    phone: "+39 011 4445566",
    coordinates: { lat: 45.0703, lng: 7.6142 },
    services: ["Emodialisi", "Dialisi Peritoneale", "Supporto Psicologico"],
    rating: 4.5,
    likes: 156,
    comments: [],
    openingHours: "Lun-Sab: 6:30-20:30",
    isOpen: false
  },
  {
    id: "5",
    name: "Centro Dialisi Firenze",
    address: "Viale Michelangelo 78",
    city: "Firenze",
    region: "Toscana",
    phone: "+39 055 7778899",
    coordinates: { lat: 43.7696, lng: 11.2558 },
    services: ["Emodialisi", "Telemedicina", "Dialisi Vacanza"],
    rating: 4.7,
    likes: 198,
    comments: [
      {
        id: "c5",
        userId: "u5",
        userName: "Roberto F.",
        text: "Servizio di dialisi vacanza eccellente. Struttura accogliente.",
        createdAt: "2024-01-08",
        likes: 18
      }
    ],
    openingHours: "Lun-Dom: 7:00-23:00",
    isOpen: true
  },
  {
    id: "6",
    name: "Nefrologia Bologna Est",
    address: "Via Emilia 567",
    city: "Bologna",
    region: "Emilia-Romagna",
    phone: "+39 051 2223344",
    coordinates: { lat: 44.4949, lng: 11.3426 },
    services: ["Emodialisi", "Nefrologia Clinica", "Educazione Paziente"],
    rating: 4.4,
    likes: 145,
    comments: [],
    openingHours: "Lun-Ven: 6:00-20:00",
    isOpen: true
  },
  {
    id: "7",
    name: "Centro Dialisi Palermo",
    address: "Via Libertà 123",
    city: "Palermo",
    region: "Sicilia",
    phone: "+39 091 6667788",
    coordinates: { lat: 38.1157, lng: 13.3615 },
    services: ["Emodialisi", "Dialisi Peritoneale", "Cardionefrologia"],
    rating: 4.6,
    likes: 167,
    comments: [
      {
        id: "c6",
        userId: "u6",
        userName: "Maria S.",
        text: "Centro all'avanguardia con tecnologie moderne.",
        createdAt: "2024-01-11",
        likes: 9
      }
    ],
    openingHours: "Lun-Sab: 6:00-21:00",
    isOpen: true
  },
  {
    id: "8",
    name: "Dialisi Bari Centro",
    address: "Corso Vittorio Emanuele 45",
    city: "Bari",
    region: "Puglia",
    phone: "+39 080 1112233",
    coordinates: { lat: 41.1171, lng: 16.8719 },
    services: ["Emodialisi", "Emergenze", "Consulenza Dietetica"],
    rating: 4.3,
    likes: 123,
    comments: [],
    openingHours: "Lun-Ven: 7:00-19:00",
    isOpen: false
  }
];

export const regions = [
  "Tutte le Regioni",
  "Lombardia",
  "Lazio",
  "Campania",
  "Piemonte",
  "Toscana",
  "Emilia-Romagna",
  "Sicilia",
  "Puglia",
  "Veneto",
  "Calabria",
  "Sardegna",
  "Liguria",
  "Marche",
  "Abruzzo",
  "Friuli-Venezia Giulia",
  "Trentino-Alto Adige",
  "Umbria",
  "Basilicata",
  "Molise",
  "Valle d'Aosta"
];

export const serviceTypes = [
  "Emodialisi",
  "Dialisi Peritoneale",
  "Dialisi Domiciliare",
  "Dialisi Vacanza",
  "Nefrologia",
  "Emergenze 24h",
  "Trapianto Renale",
  "Telemedicina",
  "Supporto Psicologico",
  "Consulenza Nutrizionale"
];
