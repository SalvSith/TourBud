# TourBud Backend Deployment Guide

## Overview

This guide covers the deployment of TourBud's backend infrastructure using Supabase Edge Functions, Google Maps APIs, and OpenAI API integration.

## Architecture

The backend consists of 4 Supabase Edge Functions:

1. **geocode** - Converts GPS coordinates to street information
2. **get-places** - Fetches points of interest on a street
3. **generate-tour** - Creates AI-powered walking tour narration
4. **get-tour** - Retrieves saved tour data

## Prerequisites

### 1. Supabase Project Setup
- Create a new Supabase project at [supabase.com](https://supabase.com)
- Note your project URL and anon key from Settings → API

### 2. API Keys Required
- **Google Maps API Key** with the following APIs enabled:
  - Geocoding API
  - Places API (Text Search & Nearby Search)
- **OpenAI API Key** with GPT-4 access

### 3. Install Supabase CLI
```bash
npm install -g supabase
```

## Deployment Steps

### Step 1: Configure Supabase

1. Login to Supabase CLI:
```bash
supabase login
```

2. Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### Step 2: Set Environment Variables

In your Supabase project dashboard (Settings → Edge Functions → Environment Variables), add:

```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 3: Deploy Edge Functions

Deploy all functions:
```bash
# Deploy geocode function
supabase functions deploy geocode

# Deploy get-places function  
supabase functions deploy get-places

# Deploy generate-tour function
supabase functions deploy generate-tour

# Deploy get-tour function
supabase functions deploy get-tour
```

### Step 4: Configure Frontend

Update `src/config/supabase.ts` with your project details:

```typescript
export const SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_ANON_KEY_HERE',
  endpoints: {
    geocode: '/functions/v1/geocode',
    getPlaces: '/functions/v1/get-places', 
    generateTour: '/functions/v1/generate-tour',
    getTour: '/functions/v1/get-tour'
  }
};
```

## API Endpoints

### POST /functions/v1/geocode
Converts GPS coordinates to location data.

**Request:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:**
```json
{
  "streetName": "Broadway",
  "plusCode": "87G7P33M+4V",
  "area": "Financial District", 
  "city": "New York",
  "country": "United States",
  "formattedAddress": "Broadway, New York, NY, USA"
}
```

### POST /functions/v1/get-places
Fetches points of interest on a street.

**Request:**
```json
{
  "streetName": "Broadway",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 1000
}
```

**Response:**
```json
{
  "places": [
    {
      "name": "Trinity Church",
      "type": ["church", "place_of_worship"],
      "address": "75 Broadway, New York, NY",
      "placeId": "ChIJ...",
      "rating": 4.5,
      "userRatingsTotal": 2847
    }
  ],
  "total": 25
}
```

### POST /functions/v1/generate-tour
Generates AI-powered tour narration.

**Request:**
```json
{
  "locationData": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "streetName": "Broadway",
    "plusCode": "87G7P33M+4V",
    "area": "Financial District",
    "city": "New York", 
    "country": "United States"
  },
  "places": [...],
  "interests": ["history", "architecture"]
}
```

**Response:**
```json
{
  "tourId": "tour_1703123456789_abc123def",
  "narration": "Welcome to Broadway in the Financial District...",
  "title": "Broadway Walking Tour",
  "description": "Explore the historic heart of New York...",
  "estimatedDuration": 45,
  "distance": "0.8 mi"
}
```

### GET /functions/v1/get-tour?tourId=xxx
Retrieves saved tour data.

## Testing

Test each function after deployment:

```bash
# Test geocode
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/geocode' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"latitude": 40.7128, "longitude": -74.0060}'

# Test places
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/get-places' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"streetName": "Broadway", "latitude": 40.7128, "longitude": -74.0060}'
```

## Security & Rate Limiting

### Enable RLS (Row Level Security)
The database schema includes RLS policies for user data protection.

### API Rate Limiting
Consider implementing rate limiting for production:
- Google Maps API has daily quotas
- OpenAI API has rate limits based on tier

### CORS Configuration
All functions include CORS headers for web app access.

## Monitoring & Debugging

### View Function Logs
```bash
supabase functions logs geocode
supabase functions logs generate-tour
```

### Common Issues

1. **API Key Issues**: Verify keys are set in Supabase environment variables
2. **CORS Errors**: Check frontend CORS configuration
3. **Quota Exceeded**: Monitor Google Maps API usage
4. **OpenAI Timeouts**: Implement retry logic for long requests

## Production Considerations

### Caching
Consider adding Redis or Supabase KV for:
- Geocoding results (location data doesn't change often)
- Places data (can cache for 24 hours)
- Popular tour routes

### Database Storage
Implement database storage for:
- User tour history
- Popular tours for reuse
- Analytics and usage metrics

### Performance
- Monitor function cold starts
- Optimize prompts for faster OpenAI responses
- Implement pagination for large place results

## Cost Optimization

### Google Maps API
- Cache geocoding results
- Use appropriate zoom levels for places search
- Monitor daily quotas

### OpenAI API
- Optimize prompt length
- Use appropriate model (GPT-4 vs GPT-3.5)
- Implement smart caching for similar locations

### Supabase
- Monitor function invocation counts
- Optimize database queries if using storage
- Use appropriate instance sizing

## Next Steps

1. Deploy functions to Supabase
2. Configure API keys
3. Update frontend configuration
4. Test the full flow
5. Implement error handling and monitoring
6. Add user authentication (optional)
7. Implement tour saving/sharing features 