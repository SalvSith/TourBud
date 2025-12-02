import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface CheckStatusRequest {
  responseId: string;
  researchId?: string;
}

interface CheckStatusResponse {
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress?: string;
  tourData?: {
    tourId: string;
    narration: string;
    title: string;
    description: string;
    estimatedDuration: number;
    distance: string;
    sources: string[];
  };
  error?: string;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (!OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const { responseId, researchId } = await req.json() as CheckStatusRequest;

    if (!responseId) {
      return new Response(
        JSON.stringify({ error: 'Missing responseId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('🔍 Checking status for response:', responseId);

    // Poll the OpenAI Responses API for status
    const response = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('📊 Response status:', data.status);

    // Update database if we have access
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && researchId) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from('deep_research_jobs')
          .update({ 
            status: data.status,
            updated_at: new Date().toISOString()
          })
          .eq('research_id', researchId);
      } catch (dbError) {
        console.warn('⚠️ Could not update database:', dbError.message);
      }
    }

    // If still processing, return status
    if (data.status === 'queued' || data.status === 'in_progress') {
      const result: CheckStatusResponse = {
        status: data.status,
        progress: data.status === 'queued' 
          ? 'Research is queued and will start shortly...'
          : 'AI is actively researching - searching the web, analyzing sources, and compiling findings...'
      };

      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // If failed or cancelled
    if (data.status === 'failed' || data.status === 'cancelled') {
      // Log the full response for debugging
      console.error('❌ Research failed or cancelled:', JSON.stringify(data, null, 2));
      
      const result: CheckStatusResponse = {
        status: data.status,
        error: data.status === 'failed' 
          ? `Research failed: ${data.error?.message || 'Unknown error'}`
          : 'Research was cancelled.'
      };

      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // If completed, extract the tour content
    if (data.status === 'completed') {
      console.log('✅ Research completed! Extracting tour content...');

      let narration = '';
      const sources: string[] = [];

      // Extract content from the response output
      if (data.output && Array.isArray(data.output)) {
        for (const item of data.output) {
          // Log web search actions for debugging
          if (item.type === 'web_search_call') {
            console.log('📡 Web search performed:', item.action);
          }

          // Extract message content
          if (item.type === 'message' && item.content) {
            for (const contentItem of item.content) {
              if (contentItem.type === 'output_text') {
                narration += contentItem.text;

                // Extract URL citations
                if (contentItem.annotations) {
                  for (const annotation of contentItem.annotations) {
                    if (annotation.type === 'url_citation' && annotation.url) {
                      sources.push(annotation.url);
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (!narration || narration.trim().length === 0) {
        throw new Error('Research completed but no content was generated');
      }

      // Generate tour metadata
      const tourId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const wordCount = narration.split(/\s+/).length;
      const estimatedMinutes = Math.round(wordCount / 150); // ~150 words per minute speaking rate

      // Extract first meaningful paragraph for description
      const paragraphs = narration.split('\n\n').filter(p => p.trim().length > 50);
      const description = paragraphs[0]?.substring(0, 250) + '...' || 'A comprehensive historical walking tour';

      // Extract title from content or generate one
      let title = 'Historical Walking Tour';
      const titleMatch = narration.match(/^#\s*(.+?)$/m) || narration.match(/^##\s*(.+?)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }

      console.log('📝 Tour generated:');
      console.log('  - Words:', wordCount);
      console.log('  - Estimated duration:', estimatedMinutes, 'minutes');
      console.log('  - Sources:', sources.length);

      // Update database with completed tour
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && researchId) {
        try {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          await supabase.from('deep_research_jobs')
            .update({ 
              status: 'completed',
              tour_id: tourId,
              narration: narration,
              sources: sources,
              word_count: wordCount,
              completed_at: new Date().toISOString()
            })
            .eq('research_id', researchId);
        } catch (dbError) {
          console.warn('⚠️ Could not update database with results:', dbError.message);
        }
      }

      const result: CheckStatusResponse = {
        status: 'completed',
        tourData: {
          tourId,
          narration,
          title,
          description,
          estimatedDuration: Math.max(25, Math.min(50, estimatedMinutes)),
          distance: '1.0 mi',
          sources: [...new Set(sources)], // Deduplicate
        }
      };

      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Unknown status
    return new Response(
      JSON.stringify({ status: data.status, error: 'Unknown status' }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('❌ Check status error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

