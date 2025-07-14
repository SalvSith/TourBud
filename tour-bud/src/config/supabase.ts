// Supabase configuration
// Replace these with your actual Supabase project details

export const SUPABASE_CONFIG = {
  // Get these from your Supabase project settings
  // Dashboard -> Settings -> API
  url: 'https://eblwdcvtvcstfjemudmr.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVibHdkY3Z0dmNzdGZqZW11ZG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTM5ODksImV4cCI6MjA2Nzk4OTk4OX0.Ode3suEbK_fUsGGmiUiP2QA6UtvZ2XCAQtW9jqnkwZs', // Replace with your actual anon key from the dashboard
  
  // API endpoints for Edge Functions
  endpoints: {
    geocode: '/functions/v1/geocode',
    getPlaces: '/functions/v1/get-places',
    generateTour: '/functions/v1/generate-tour',
    getTour: '/functions/v1/get-tour',
    getMapUrl: '/functions/v1/get-map-url',
    placesAutocomplete: '/functions/v1/places-autocomplete'
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