# 🚀 TourBud Quick Setup - Get Running in 5 Minutes!

## Your Project is Connected!
✅ **Project URL**: https://eblwdcvtvcstfjemudmr.supabase.co  
✅ **Project Linked**: Successfully connected to your TourBud project

## Step 1: Get Your API Keys (2 minutes)

### Get Supabase Anon Key
1. Go to: https://supabase.com/dashboard/project/eblwdcvtvcstfjemudmr/settings/api
2. Copy the **anon/public** key
3. Update `src/config/supabase.ts` line 6 with your key

### Get External API Keys
You'll need these two API keys:

**Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable: Geocoding API + **Places API** + **Static Maps API**
3. Create API key
4. This will be added to Supabase Edge Functions environment variables (no frontend setup needed)
5. **NEW**: Places API is used for address autocomplete functionality

**OpenAI API Key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key
3. Ensure you have GPT-4 access

## Step 2: Deploy Edge Functions (3 minutes)

### Option A: Manual Deployment (Recommended if Docker issues)
1. Go to: https://supabase.com/dashboard/project/eblwdcvtvcstfjemudmr/functions
2. Click "Create new function" for each:

**Function 1: geocode**
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

interface GeocodeRequest {
  latitude: number;
  longitude: number;
}

interface GeocodeResponse {
  streetName: string;
  plusCode: string;
  area: string;
  city: string;
  country: string;
  formattedAddress: string;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      });
    }

    const { latitude, longitude } = await req.json() as GeocodeRequest;

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Missing latitude or longitude' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      throw new Error(`Geocoding failed: ${geocodeData.status}`);
    }

    const result = geocodeData.results[0];
    const addressComponents = result.address_components || [];
    
    let streetName = '';
    const route = addressComponents.find((comp: any) => comp.types.includes('route'));
    if (route) {
      streetName = route.long_name;
    }

    let plusCode = '';
    if (geocodeData.plus_code) {
      plusCode = geocodeData.plus_code.global_code || geocodeData.plus_code.compound_code || '';
    }

    let area = '';
    let city = '';
    let country = '';

    const neighborhood = addressComponents.find((comp: any) => comp.types.includes('neighborhood'));
    const locality = addressComponents.find((comp: any) => comp.types.includes('locality'));
    const countryComp = addressComponents.find((comp: any) => comp.types.includes('country'));

    if (neighborhood) area = neighborhood.long_name;
    if (locality) city = locality.long_name;
    if (countryComp) country = countryComp.long_name;

    const response: GeocodeResponse = {
      streetName,
      plusCode,
      area,
      city,
      country,
      formattedAddress: result.formatted_address
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
```

**Function 2: get-map-url**
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

interface MapUrlRequest {
  address: string;
  zoom?: number;
  size?: string;
  mapType?: string;
  markerColor?: string;
}

interface MapUrlResponse {
  mapUrl: string;
  address: string;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const { 
      address, 
      zoom = 16, 
      size = '400x120', 
      mapType = 'roadmap', 
      markerColor = 'red' 
    } = await req.json() as MapUrlRequest;

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const encodedAddress = encodeURIComponent(address);
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=${zoom}&size=${size}&maptype=${mapType}&markers=color:${markerColor}%7C${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

    const response: MapUrlResponse = {
      mapUrl,
      address
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Map URL generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
```

**Function 3: places-autocomplete**
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

interface AutocompleteRequest {
  input: string;
  sessiontoken?: string;
}

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AutocompleteResponse {
  predictions: PlacePrediction[];
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const { input, sessiontoken } = await req.json() as AutocompleteRequest;

    if (!input || input.length < 2) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const autocompleteUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    autocompleteUrl.searchParams.set('input', input);
    autocompleteUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);
    autocompleteUrl.searchParams.set('types', 'address');
    
    if (sessiontoken) {
      autocompleteUrl.searchParams.set('sessiontoken', sessiontoken);
    }

    const response = await fetch(autocompleteUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${data.status}`);
    }

    const autocompleteResponse: AutocompleteResponse = {
      predictions: data.predictions || []
    };

    return new Response(
      JSON.stringify(autocompleteResponse),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Places autocomplete error:', error);
    return new Response(
      JSON.stringify({ error: error.message, predictions: [] }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
```

### Option B: CLI Deployment (When Docker is Ready)
```bash
cd tour-bud
./deploy-functions.sh
```

## Step 3: Set Environment Variables

1. Go to: https://supabase.com/dashboard/project/eblwdcvtvcstfjemudmr/functions
2. Click "Settings" → "Environment Variables"
3. Add:
   - `GOOGLE_MAPS_API_KEY` = your_google_key
   - `OPENAI_API_KEY` = your_openai_key

**Note:** The Google Maps API key is now used server-side only for security. No frontend environment variables needed!

## Step 4: Test Your Setup! 🎉
1. Update `src/config/supabase.ts` with your anon key
2. Run: `npm start`
3. Click "Craft New Tour"
4. Allow location access
5. Select interests
6. Watch AI generate your tour!

## 📱 Mobile Testing Requirements

### HTTPS is Required for Mobile Location Access
- **Development**: Use `https://localhost:3000` instead of `http://localhost:3000`
- **Production**: Always deploy to HTTPS (Netlify, Vercel, etc.)
- **Local HTTPS Setup**: 
  ```bash
  # In your package.json scripts:
  "start": "HTTPS=true react-scripts start"
  ```

### Mobile Safari Specific Notes
- ✅ **Fixed**: Location permission now requires user interaction (tap the "Use My Current Location" button)
- ✅ **Fixed**: Better error handling for permission denied scenarios
- ✅ **Fixed**: Automatic fallback to manual address entry if geolocation fails
- ⚠️ **Important**: Test on actual mobile devices, not just desktop browser dev tools

### Testing Workflow
1. **Desktop**: Location requests automatically on page load
2. **Mobile**: Shows "Use My Current Location" button for user interaction
3. **Fallback**: Manual address entry with Google Places autocomplete
4. **Error Handling**: Clear messages for permission denied, timeout, or unavailable scenarios

## 🚨 Quick Notes:
- **Essential functions**: geocode, get-map-url, places-autocomplete for core location features
- Other functions (get-places, generate-tour, get-tour) can be added later for full tour generation
- The frontend gracefully handles missing functions with fallbacks
- **NEW**: Map screenshots now use server-side API for better security
- **NEW**: Address autocomplete provides Google Places suggestions as you type
- **FIXED**: Mobile Safari location permission issues resolved

## 📞 Need Help?
If functions don't deploy:
1. Try manual deployment first (copy/paste code)
2. Check API keys are set in Supabase dashboard
3. Verify HTTPS is enabled for mobile testing
4. Check browser console for specific error messages

The enhanced mobile experience includes:
- Smart device detection
- User-friendly permission requests
- Better error messaging
- Seamless fallback to manual entry 