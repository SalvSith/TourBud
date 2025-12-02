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
    generateTour: '/functions/v1/generate-tour',
    getTour: '/functions/v1/get-tour',
    getMapUrl: '/functions/v1/get-map-url',
    placesAutocomplete: '/functions/v1/places-autocomplete',
    // Deep research endpoints
    startDeepResearch: '/functions/v1/start-deep-research',
    checkResearchStatus: '/functions/v1/check-research-status',
    // Perplexity research (primary research method)
    perplexityResearch: '/functions/v1/perplexity-research',
    // IP-based geolocation fallback
    getIpLocation: '/functions/v1/get-ip-location'
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
//     generateTour: '/functions/v1/generate-tour',
//     getTour: '/functions/v1/get-tour',
//     getMapUrl: '/functions/v1/get-map-url'
//   }
// }; 