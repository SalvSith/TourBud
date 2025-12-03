import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Generate Audio Edge Function for TourBud
 * 
 * Uses ElevenLabs API to convert tour narration to speech.
 * Handles long text by splitting into chunks and concatenating audio.
 * Stores the resulting audio in Supabase Storage.
 */

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// ElevenLabs voice IDs - using a clear, professional narrator voice
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // "Sarah" - clear, warm female voice

// ElevenLabs Flash v2.5 has a 40,000 character limit
// We'll use 35000 to be safe and allow for clean breaks
const MAX_CHARS_PER_CHUNK = 35000;

// Model ID - using Flash v2.5 for 40k char limit, lower cost, faster speed
const MODEL_ID = 'eleven_flash_v2_5';

interface GenerateAudioRequest {
  tourId: string;
  narration?: string;
}

interface GenerateAudioResponse {
  success: boolean;
  audioUrl?: string;
  audioDuration?: number;
  audioFileSize?: number;
  error?: string;
}

// Clean narration text for TTS (remove markdown, citations, etc.)
function cleanNarrationForTTS(narration: string): string {
  let cleaned = narration;
  
  // Remove markdown headers but keep as section breaks
  cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, '\n$1.\n');
  
  // Remove markdown bold/italic
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/__(.+?)__/g, '$1');
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
  cleaned = cleaned.replace(/_(.+?)_/g, '$1');
  
  // Remove citation markers [1], [2], etc.
  cleaned = cleaned.replace(/\[\d+\]/g, '');
  
  // Remove horizontal rules
  cleaned = cleaned.replace(/^---+$/gm, '');
  
  // Remove bullet points but keep the content
  cleaned = cleaned.replace(/^[-*]\s+/gm, '');
  
  // Remove numbered lists markers but keep content
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');
  
  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  
  // Collapse multiple newlines to pauses
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Split text into chunks at natural break points (sentences, paragraphs)
function splitTextIntoChunks(text: string, maxChars: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the limit
    if (currentChunk.length + paragraph.length + 2 > maxChars) {
      // If current chunk has content, save it
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If the paragraph itself is too long, split by sentences
      if (paragraph.length > maxChars) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChars) {
            if (currentChunk.trim()) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }
            
            // If single sentence is still too long, just add it
            if (sentence.length > maxChars) {
              chunks.push(sentence.trim());
            } else {
              currentChunk = sentence;
            }
          } else {
            currentChunk += sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      // Add paragraph to current chunk
      if (currentChunk) {
        currentChunk += '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
      }
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Generate audio for a single text chunk
async function generateAudioChunk(text: string): Promise<Uint8Array> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: text,
        model_id: MODEL_ID, // Flash v2.5: 40k chars, 50% cheaper, ~75ms latency
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  return new Uint8Array(audioBuffer);
}

// Simple MP3 concatenation - works for MP3 files with same settings
function concatenateMP3s(audioChunks: Uint8Array[]): Uint8Array {
  const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of audioChunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

// Estimate audio duration based on word count (avg 150 words per minute for narration)
function estimateAudioDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  return Math.ceil((wordCount / 150) * 60);
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

    if (!ELEVENLABS_API_KEY) {
      throw new Error('Missing ELEVENLABS_API_KEY environment variable');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    const { tourId, narration: providedNarration } = await req.json() as GenerateAudioRequest;

    if (!tourId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing tourId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`🎙️ Starting audio generation for tour: ${tourId}`);

    // Connect to Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update status to processing
    await supabase
      .from('tours')
      .update({ audio_status: 'processing', updated_at: new Date().toISOString() })
      .eq('tour_id', tourId);

    // Get narration from database if not provided
    let narration = providedNarration;
    if (!narration) {
      const { data: tour, error: fetchError } = await supabase
        .from('tours')
        .select('narration')
        .eq('tour_id', tourId)
        .single();

      if (fetchError || !tour) {
        throw new Error(`Tour not found: ${tourId}`);
      }

      narration = tour.narration;
    }

    if (!narration || narration.trim().length === 0) {
      throw new Error('Tour narration is empty');
    }

    // Clean the narration for TTS
    const cleanedNarration = cleanNarrationForTTS(narration);
    const estimatedDuration = estimateAudioDuration(cleanedNarration);
    
    console.log(`📝 Cleaned narration: ${cleanedNarration.length} chars, ~${estimatedDuration}s estimated`);

    // Split into chunks if needed
    const chunks = splitTextIntoChunks(cleanedNarration, MAX_CHARS_PER_CHUNK);
    console.log(`📦 Split into ${chunks.length} chunk(s)`);

    // Generate audio for each chunk
    const audioChunks: Uint8Array[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`🔊 Generating audio chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
      const audioChunk = await generateAudioChunk(chunks[i]);
      audioChunks.push(audioChunk);
      console.log(`✅ Chunk ${i + 1} complete: ${audioChunk.length} bytes`);
    }

    // Concatenate all audio chunks
    const finalAudio = concatenateMP3s(audioChunks);
    const audioFileSize = finalAudio.length;

    console.log(`✅ Total audio generated: ${audioFileSize} bytes`);

    // Upload to Supabase Storage
    const fileName = `${tourId}.mp3`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tour-audio')
      .upload(fileName, finalAudio, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    console.log(`💾 Audio uploaded to storage: ${fileName}`);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('tour-audio')
      .getPublicUrl(fileName);

    const audioUrl = urlData.publicUrl;

    // Update the tour record with audio info
    const { error: updateError } = await supabase
      .from('tours')
      .update({
        audio_url: audioUrl,
        audio_duration: estimatedDuration,
        audio_file_size: audioFileSize,
        audio_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('tour_id', tourId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update tour: ${updateError.message}`);
    }

    console.log(`✨ Audio generation complete for tour: ${tourId}`);
    console.log(`🔗 Audio URL: ${audioUrl}`);

    const response: GenerateAudioResponse = {
      success: true,
      audioUrl,
      audioDuration: estimatedDuration,
      audioFileSize
    };

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('❌ Audio generation error:', error);

    // Try to update status to failed if we have a tourId
    try {
      const body = await req.clone().json();
      if (body.tourId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from('tours')
          .update({ 
            audio_status: 'failed', 
            updated_at: new Date().toISOString() 
          })
          .eq('tour_id', body.tourId);
      }
    } catch (updateErr) {
      console.error('Failed to update status to failed:', updateErr);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
