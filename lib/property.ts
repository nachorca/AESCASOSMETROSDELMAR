// lib/property.ts
// ============================================================
// Configuración central del apartamento
// ============================================================
// Toda la información del apartamento vive aquí.
// Si cambia algo (precio, equipamiento, normas...), se cambia
// SOLO en este archivo y se actualiza en toda la web.
//
// NAMING:
//   - name / brand  -> "A escasos metros del mar" (nombre oficial,
//     el que aparece en Airbnb y Booking)
//   - nickname      -> "Los Roques" (guiño personal, gancho)
// ============================================================

export const propertyConfig = {
  // --- Identidad y marca ---
  brand: "A escasos metros del mar",
  name: "A escasos metros del mar",
  nickname: "Los Roques", // guiño personal, se usa solo como gancho
  tagline: "El Campello · Costa Blanca",
  slug: "a-escasos-metros-del-mar-campello",

  // --- Ubicación ---
  city: "El Campello",
  province: "Alicante",
  country: "España",
  region: "Costa Blanca",
  distanceToBeachMeters: 50,

  // --- Hero ---
  heroTitle: "A escasos metros del mar",
  heroSubtitle: "Nuestro pequeño Los Roques · El Campello, Alicante",
  heroDescription:
    "Un apartamento luminoso a 50 metros del Mediterráneo. Perfecto para vacaciones, escapadas y teletrabajo frente al mar.",

  // --- Descripción larga (para SEO y secciones) ---
  description:
    "A escasos metros del mar es un apartamento turístico en El Campello, a tan solo 50 metros del mar. 90 m² con 2 dormitorios, 2 baños, terraza y todo el equipamiento necesario. WiFi de fibra de 1000 Mbps, aire acondicionado y cocina totalmente equipada. Ideal para familias y grupos que buscan calidad, comodidad y mar.",

  // --- Capacidad ---
  maxGuests: 4,
  minAge: 18,

  // --- Precios (base; los precios reales del calendario están en Supabase) ---
  basePrice: 130,
  cleaningFee: 75,
  currency: "EUR",

  // --- Horarios ---
  checkInTime: "16:00",
  checkOutTime: "10:00",
  minNights: 2,

  // --- Características físicas ---
  squareMeters: 90,
  bedrooms: 2,
  bathrooms: 2,
  beds: ["1 cama doble de matrimonio", "3 camas individuales"],
  cribAvailable: true, // cuna disponible bajo petición
  hasElevator: true,
  hasParking: true,
  hasTerrace: true,

  // --- Normas ---
  rules: {
    pets: false,
    smoking: false,
    parties: false,
    minAge: 18,
  },

  // --- Equipamiento (para mostrar como checklist en la web) ---
  amenities: [
    { icon: "📶", label: "WiFi fibra 1000 Mbps", category: "tech" },
    { icon: "❄️", label: "Aire acondicionado", category: "comfort" },
    { icon: "🔥", label: "Calefacción", category: "comfort" },
    { icon: "🍳", label: "Cocina totalmente equipada", category: "kitchen" },
    { icon: "☕", label: "Cafetera", category: "kitchen" },
    { icon: "🧺", label: "Lavadora", category: "laundry" },
    { icon: "🍽️", label: "Lavavajillas", category: "kitchen" },
    { icon: "📺", label: "Smart TV", category: "entertainment" },
    { icon: "🌅", label: "Terraza", category: "outdoor" },
    { icon: "🛗", label: "Ascensor", category: "building" },
    { icon: "🚗", label: "Parking", category: "building" },
    { icon: "🏖️", label: "A 50m de la playa", category: "location" },
  ],

  // --- Propuesta de valor reserva directa vs Airbnb ---
  directBookingPerks: [
    "Hasta un 18% más barato que en Airbnb (sin comisiones)",
    "Atención directa por WhatsApp con el anfitrión",
    "Check-in flexible sin coste extra",
    "Cancelación gratuita hasta 7 días antes",
    "Botella de cava de bienvenida 🍾",
  ],

  // --- Contacto ---
  whatsappPhone: "34665691462",
  whatsappDisplay: "+34 665 691 462",
  email: "info@aescasosmetrosdelmar.com",
  hostName: "Jose",
  hostLanguages: ["Español"],

  // --- Legal (obligatorio en Comunidad Valenciana) ---
  touristRegistrationNumber: "", // TODO: añadir VT-xxxxxx-A
  legalEntity: "", // TODO: añadir NIF/CIF si corresponde

  // --- Imágenes ---
  images: [
    "/images/portada.jpg",
    "/images/PORTADA 2.jpg",
    "/images/IMG_9621.jpg",
    "/images/IMG_9622.jpg",
    "/images/IMG_9623.jpg",
    "/images/IMG_9624.jpg",
    "/images/IMG_9625.jpg",
    "/images/IMG_9626.jpg",
  ],

  // --- Google Maps (texto seguro para URL) ---
  mapsQuery: "El Campello Alicante paseo marítimo",

  // --- URLs externas ---
  airbnbUrl: "", // TODO: añadir URL pública del listing en Airbnb
  bookingUrl:
    "https://www.booking.com/hotel/es/a-metros-de-la-playa-el-campello.es.html",
} as const;

// Tipo inferido para usar en otros componentes con autocompletado
export type PropertyConfig = typeof propertyConfig;
