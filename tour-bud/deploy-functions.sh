#!/bin/bash

echo "🚀 Deploying TourBud Edge Functions to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Initialize Supabase project if not already done
if [ ! -f "supabase/config.toml" ]; then
    echo "📦 Initializing Supabase project..."
    supabase init
fi

# Link to your existing project
echo "🔗 Linking to TourBud project..."
supabase link --project-ref eblwdcvtvcstfjemudmr

# Deploy all Edge Functions
echo "📡 Deploying geocode function..."
supabase functions deploy geocode

echo "📡 Deploying get-places function..."
supabase functions deploy get-places

echo "📡 Deploying generate-tour function..."
supabase functions deploy generate-tour

echo "📡 Deploying get-tour function..."
supabase functions deploy get-tour

echo "📡 Deploying get-map-url function..."
supabase functions deploy get-map-url

echo "📡 Deploying places-autocomplete function..."
supabase functions deploy places-autocomplete

echo ""
echo "✅ All functions deployed successfully!"
echo ""
echo "🔑 Next steps:"
echo "1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/eblwdcvtvcstfjemudmr"
echo "2. Navigate to Settings → API to get your anon key"
echo "3. Update src/config/supabase.ts with your anon key"
echo "4. Go to Settings → Edge Functions → Environment Variables and add:"
echo "   - GOOGLE_MAPS_API_KEY=your_google_maps_api_key"
echo "   - OPENAI_API_KEY=your_openai_api_key"
echo ""
echo "🎉 Your TourBud backend is ready!" 