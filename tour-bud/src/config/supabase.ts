// Supabase configuration
// Replace these with your actual Supabase project details

export const SUPABASE_CONFIG = {
  // Get these from your Supabase project settings
  // Dashboard -> Settings -> API
  url: 'https://zszmnvmohiuzlokkexzk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzem1udm1vaGl1emxva2tleHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDc2MDUsImV4cCI6MjA4MDE4MzYwNX0.QT40tFOJRuny2IXNdFVnp1X-xCVjcjfyxWpvd8rf5bI',
  
  // API endpoints for Edge Functions
  endpoints: {
    geocode: '/functions/v1/geocode',
    getPlaces: '/functions/v1/get-places',
    getMapUrl: '/functions/v1/get-map-url',
    placesAutocomplete: '/functions/v1/places-autocomplete',
    getIpLocation: '/functions/v1/get-ip-location',
    // Primary tour generation (Perplexity API)
    perplexityResearch: '/functions/v1/perplexity-research',
    // Tour storage and retrieval
    getTour: '/functions/v1/get-tour',
    listTours: '/functions/v1/list-tours',
    // Audio generation (ElevenLabs)
    generateAudio: '/functions/v1/generate-audio'
  }
};

// For local development with Supabase CLI
// Uncomment and use these if running locally
// export const SUPABASE_CONFIG = {
//   url: 'http://localhost:54321',
//   anonKey: 'your-local-anon-key',
//   endpoints: {
//     geocode: '/functions/v1/geocode',
//     getPlaces: '/functions/v1/get-places',
//     getMapUrl: '/functions/v1/get-map-url',
//     placesAutocomplete: '/functions/v1/places-autocomplete',
//     getIpLocation: '/functions/v1/get-ip-location',
//     perplexityResearch: '/functions/v1/perplexity-research'
//   }
// }; 