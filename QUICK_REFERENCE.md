# TourBud Perplexity Research - Quick Reference

## 🚀 What's Happening?

Your TourBud app uses **Perplexity's Sonar-Pro API** to create comprehensive historical walking tours with real-time web research and citations.

## 📱 How Users Experience It

### Current System:
1. Pick location → Wait 30-90 seconds → Get comprehensive 15-25 min tour with citations

## 🎯 Key Features

| Feature | Details |
|---------|---------|
| **Research Method** | 5 parallel Perplexity queries |
| **Tour Length** | 15-25 minutes |
| **Historical Facts** | Specific dates, names, events from web |
| **Sources** | URL citations included |
| **User Interests** | Subtle influence only |
| **Generation Time** | 30-90 seconds |
| **Cost** | ~$0.50-1 per tour |

## 🔧 What's Deployed

### Database:
- ✅ `deep_research_jobs` table (stores tour data and citations)

### Edge Functions:
- ✅ `perplexity-research` (primary tour generation)
- ✅ `geocode`, `get-places`, `get-map-url`, `places-autocomplete`, `get-ip-location`

### Frontend:
- ✅ 3-stage progress UI with timer
- ✅ Optimized for fast generation
- ✅ Citation system with clickable sources

## 💰 Cost Considerations

**Good News**: Perplexity is cost-effective!

- **Per Tour**: ~$0.50-1 per tour
- **Much cheaper** than previous OpenAI deep research
- **Fast generation** with comprehensive results

### Recommendations:
1. **For Testing**: Reasonable costs for testing
2. **For Production**: Consider:
   - Paid user tiers for sustainability
   - Usage limits per user
   - Cache popular streets to reduce API calls
   - Monitor Perplexity API usage

## 🧪 Testing

### Test It Now:
```
1. Go to: https://tourbud.vercel.app
2. Enter: "Abbey Road, London" (or any historic street)
3. Select interests
4. Select places (optional)
5. Click Generate Tour
6. Wait 30-90 seconds
7. See comprehensive historical tour with citations!
```

### What to Look For:
- ✅ 3-stage progress UI (Searching → Researching → Writing)
- ✅ Elapsed time counter
- ✅ Tour includes specific historical dates
- ✅ Tour mentions real people and events
- ✅ Tour is 15-25 minutes long
- ✅ Clickable source citations at bottom

## 🔍 Monitoring

### Check Function Logs:
1. Go to: https://supabase.com/dashboard/project/zszmnvmohiuzlokkexzk/functions
2. Click on `perplexity-research` function
3. View "Logs" tab

### Check Database:
```sql
-- See all generated tours
SELECT * FROM deep_research_jobs ORDER BY created_at DESC;

-- See tours with sources
SELECT research_id, word_count, array_length(sources, 1) as source_count, created_at 
FROM deep_research_jobs 
WHERE status = 'completed'
ORDER BY created_at DESC;
```

## ⚠️ Troubleshooting

### "Research Failed" Error:
- **Cause**: Perplexity API rate limit or error
- **Solution**: Retry immediately or wait a minute

### Generation Takes Too Long (>2 min):
- **Cause**: Network issues or API slowdown
- **Solution**: Refresh and try again

### Few or No Sources:
- **Cause**: Limited web information for that location
- **Solution**: Tour is still generated with available data

## 📊 Your Project Info

- **Project ID**: zszmnvmohiuzlokkexzk
- **Project Name**: Tourbud
- **Region**: eu-central-2
- **Status**: ✅ ACTIVE_HEALTHY

## 🎓 Technical Details

### API Flow:
```
1. POST /perplexity-research
   → Runs 5 parallel queries:
     - Interests × Area
     - Selected Places (if any)
     - Area General History
     - Street Specific
     - Notable Places (100+ reviews)
   
2. Perplexity searches web for each query

3. Results combined into comprehensive tour

4. Returns: { tourId, narration, title, description, 
              estimatedDuration, distance, sources[] }
```

### Model Used:
- **Primary**: Perplexity `sonar-pro` with web search
- **Search Context**: High (comprehensive results)

## 🎉 You're All Set!

Everything is deployed and working. Your app creates comprehensive historical walking tours in 30-90 seconds using Perplexity's real-time web research.

### Questions?
- Check Supabase logs for errors
- Review browser console for frontend issues
- Verify Perplexity API key is configured

---

**Status**: ✅ All systems operational (Perplexity-exclusive)
**Last Updated**: December 2024

