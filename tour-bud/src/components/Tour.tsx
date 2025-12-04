import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Play, Pause, MapPin, ExternalLink, BookOpen, Calendar, VolumeX, SkipBack, SkipForward, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BurgerMenu from './BurgerMenu';
import BackButton from './BackButton';
import { SUPABASE_CONFIG } from '../config/supabase';
import tourService from '../services/tourService';

// Simple markdown renderer for tour content
const renderMarkdown = (text: string, onCitationClick?: (index: number) => void): React.ReactNode => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join(' ');
      elements.push(
        <p key={elements.length} style={{ marginBottom: '16px', lineHeight: '1.8' }}>
          {renderInlineMarkdown(paragraphText)}
        </p>
      );
      currentParagraph = [];
    }
  };
  
  const renderInlineMarkdown = (line: string): React.ReactNode => {
    // Handle bold **text** and __text__ AND citations [1], [2], etc.
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIndex = 0;
    
    while (remaining.length > 0) {
      // Check for citations [1], [2], [3] etc. OR bold
      const citationMatch = remaining.match(/\[(\d+)\]/);
      const boldMatch = remaining.match(/\*\*(.+?)\*\*|__(.+?)__/);
      
      // Find which comes first
      const citationIndex = citationMatch?.index ?? Infinity;
      const boldIndex = boldMatch?.index ?? Infinity;
      
      if (citationIndex < boldIndex && citationMatch && citationMatch.index !== undefined) {
        // Citation comes first
        if (citationMatch.index > 0) {
          parts.push(remaining.substring(0, citationMatch.index));
        }
        const citationNum = parseInt(citationMatch[1], 10);
        parts.push(
          <span
            key={keyIndex++}
            onClick={() => onCitationClick?.(citationNum - 1)}
            style={{
              fontSize: '11px',
              color: 'var(--primary-color)',
              cursor: 'pointer',
              verticalAlign: 'super',
              fontWeight: '500',
              opacity: 0.8,
              transition: 'opacity 0.2s',
              padding: '0 1px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; }}
            title={`View source ${citationNum}`}
          >
            [{citationNum}]
          </span>
        );
        remaining = remaining.substring(citationMatch.index + citationMatch[0].length);
      } else if (boldIndex < citationIndex && boldMatch && boldMatch.index !== undefined) {
        // Bold comes first
        if (boldMatch.index > 0) {
          parts.push(remaining.substring(0, boldMatch.index));
        }
        parts.push(
          <strong key={keyIndex++}>{boldMatch[1] || boldMatch[2]}</strong>
        );
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      } else {
        // No more matches, add remaining text
        parts.push(remaining);
        break;
      }
    }
    
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Empty line - flush paragraph
    if (trimmedLine === '') {
      flushParagraph();
      continue;
    }
    
    // Headers
    if (trimmedLine.startsWith('### ')) {
      flushParagraph();
      elements.push(
        <h4 key={elements.length} style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          marginTop: '24px', 
          marginBottom: '12px',
          color: 'var(--text-primary)'
        }}>
          {trimmedLine.replace(/^### /, '')}
        </h4>
      );
      continue;
    }
    
    if (trimmedLine.startsWith('## ')) {
      flushParagraph();
      elements.push(
        <h3 key={elements.length} style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginTop: '28px', 
          marginBottom: '14px',
          color: 'var(--primary-color)'
        }}>
          {trimmedLine.replace(/^## /, '')}
        </h3>
      );
      continue;
    }
    
    if (trimmedLine.startsWith('# ')) {
      flushParagraph();
      elements.push(
        <h2 key={elements.length} style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          marginTop: '32px', 
          marginBottom: '16px',
          color: 'var(--text-primary)'
        }}>
          {trimmedLine.replace(/^# /, '')}
        </h2>
      );
      continue;
    }
    
    // Bullet points
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      flushParagraph();
      elements.push(
        <div key={elements.length} style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '8px',
          paddingLeft: '8px'
        }}>
          <span style={{ color: 'var(--primary-color)' }}>•</span>
          <span style={{ lineHeight: '1.6' }}>{renderInlineMarkdown(trimmedLine.substring(2))}</span>
        </div>
      );
      continue;
    }
    
    // Numbered lists
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      flushParagraph();
      elements.push(
        <div key={elements.length} style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '8px',
          paddingLeft: '8px'
        }}>
          <span style={{ color: 'var(--primary-color)', fontWeight: '600', minWidth: '20px' }}>
            {numberedMatch[1]}.
          </span>
          <span style={{ lineHeight: '1.6' }}>{renderInlineMarkdown(numberedMatch[2])}</span>
        </div>
      );
      continue;
    }
    
    // Regular text - add to current paragraph
    currentParagraph.push(trimmedLine);
  }
  
  // Flush any remaining paragraph
  flushParagraph();
  
  return elements;
};

const Tour: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: tourIdFromUrl } = useParams<{ id: string }>();
  
  const [timeRemaining, setTimeRemaining] = useState(45); // minutes
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [loadingTour, setLoadingTour] = useState(false);
  const [tourData, setTourData] = useState<any>(null);
  const [tourLocation, setTourLocation] = useState<string>('');
  const sourceRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  
  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioStatus, setAudioStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false); // Toggle between button and player
  const [playCount] = useState(() => Math.floor(Math.random() * 2000) + 500); // Generate once on mount
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Handle citation click - scroll to the source
  const handleCitationClick = (index: number) => {
    const sourceElement = sourceRefs.current[index];
    if (sourceElement) {
      sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight briefly
      sourceElement.style.transform = 'scale(1.02)';
      sourceElement.style.borderColor = 'var(--primary-color)';
      sourceElement.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.3)';
      setTimeout(() => {
        sourceElement.style.transform = '';
        sourceElement.style.borderColor = '';
        sourceElement.style.boxShadow = '';
      }, 2000);
    }
  };

  // Load tour data either from navigation state or from database
  useEffect(() => {
    const stateData = location.state as any;
    
    if (stateData?.tourData) {
      // Tour data passed via navigation
      setTourData(stateData.tourData);
      setTourLocation(stateData.location || '');
      // Set initial audio state from tour data
      setAudioStatus(stateData.tourData.audioStatus || 'pending');
      setAudioUrl(stateData.tourData.audioUrl || null);
    } else if (tourIdFromUrl) {
      // Load tour from database using URL parameter
      loadTourFromDatabase(tourIdFromUrl);
    }
  }, [tourIdFromUrl, location.state]);

  const loadTourFromDatabase = async (tourId: string) => {
    setLoadingTour(true);
    try {
      const tour = await tourService.getTour(tourId);
      setTourData(tour);
      setTourLocation(tour.locationData?.formattedAddress || '');
      // Set audio state from tour data
      setAudioStatus(tour.audioStatus || 'pending');
      setAudioUrl(tour.audioUrl || null);
    } catch (error) {
      console.error('Failed to load tour:', error);
      // Show error or redirect
      navigate('/');
    } finally {
      setLoadingTour(false);
    }
  };

  // Poll for audio status when it's processing
  useEffect(() => {
    if (audioStatus === 'processing' && tourData?.tourId) {
      console.log('🎙️ Starting audio status polling...');
      
      pollingRef.current = setInterval(async () => {
        try {
          const updatedTour = await tourService.getTour(tourData.tourId);
          console.log('🔄 Audio status:', updatedTour.audioStatus);
          
          if (updatedTour.audioStatus === 'completed' && updatedTour.audioUrl) {
            setAudioStatus('completed');
            setAudioUrl(updatedTour.audioUrl);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          } else if (updatedTour.audioStatus === 'failed') {
            setAudioStatus('failed');
            setAudioError('Audio generation failed');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        } catch (err) {
          console.error('Error polling audio status:', err);
        }
      }, 3000); // Poll every 3 seconds

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }
  }, [audioStatus, tourData?.tourId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Audio event handlers
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsAudioReady(true);
      setAudioLoading(false);
    }
  }, []);

  const handleAudioError = useCallback(() => {
    setAudioError('Failed to load audio');
    setAudioLoading(false);
    setIsAudioReady(false);
  }, []);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Initialize audio element when URL is available
  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      setAudioLoading(true);
      const audio = new Audio(audioUrl);
      audio.preload = 'metadata';
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleAudioError);
      audio.addEventListener('ended', handleAudioEnded);
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('error', handleAudioError);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current = null;
      }
    };
  }, [audioUrl, handleTimeUpdate, handleLoadedMetadata, handleAudioError, handleAudioEnded]);

  // Audio control functions
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !isAudioReady) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Failed to play audio:', err);
        setAudioError('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, isAudioReady]);


  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.currentTime + 15, duration);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const skipBackward = useCallback(() => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - 15, 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seekTo(newTime);
  }, [duration, seekTo]);

  const retryAudioGeneration = useCallback(async () => {
    if (!tourData?.tourId || isRetrying) return;
    
    setIsRetrying(true);
    setAudioError(null);
    setAudioStatus('processing');
    
    try {
      await tourService.generateAudio(tourData.tourId);
      // The polling will pick up when it's ready
    } catch (err) {
      console.error('Failed to retry audio generation:', err);
      setAudioError('Failed to generate audio');
      setAudioStatus('failed');
    } finally {
      setIsRetrying(false);
    }
  }, [tourData?.tourId, isRetrying]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer for countdown (called before any conditional returns)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          navigate('/past-tours');
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [navigate]);

  // Fetch map URL when component mounts or location changes (called before any conditional returns)
  useEffect(() => {
    if (tourLocation) {
      fetchMapUrl(tourLocation);
    }
  }, [tourLocation]);

  // Get citations/sources from tour data
  const sources: string[] = tourData?.sources || [];

  // Use actual tour data or fallback to defaults
  const tourInfo = tourData ? {
    name: tourData.title,
    description: tourData.description,
    distance: tourData.distance,
    duration: tourData.estimatedDuration
  } : {
    name: 'Historical Downtown Walk',
    description: 'Explore the city\'s founding stories and colonial architecture',
    distance: '0.8 mi',
    duration: 45
  };

  const currentLocation = tourLocation || '45 Smith Street, New York, NY';

  // Shorten location by removing country, state/sub-area, and zip code
  const shortenLocation = (location: string): string => {
    if (!location) return '';
    
    // Split by comma and take only the first 1-2 parts (street + city)
    const parts = location.split(',').map(p => p.trim());
    
    if (parts.length <= 2) {
      // Already short, just return first part or both
      return parts[0];
    }
    
    // Take first two parts (usually street and city/neighborhood)
    // Remove any zip codes from the second part
    const firstPart = parts[0];
    let secondPart = parts[1];
    
    // Remove zip codes (5 digits or 5+4 format)
    secondPart = secondPart.replace(/\s*\d{5}(-\d{4})?\s*/, '').trim();
    
    // If second part is just a state abbreviation or empty, skip it
    if (secondPart.length <= 3) {
      return firstPart;
    }
    
    return `${firstPart}, ${secondPart}`;
  };

  const shortLocation = shortenLocation(currentLocation);

  // Function to fetch map URL from server
  const fetchMapUrl = async (address: string) => {
    try {
      setMapLoading(true);
      setMapError(null);

      const response = await fetch(`${SUPABASE_CONFIG.url}${SUPABASE_CONFIG.endpoints.getMapUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'apikey': SUPABASE_CONFIG.anonKey
        },
        body: JSON.stringify({ address })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch map URL: ${response.status}`);
      }

      const data = await response.json();
      setMapUrl(data.mapUrl);
    } catch (error) {
      console.error('Error fetching map URL:', error);
      setMapError(error instanceof Error ? error.message : 'Failed to load map');
    } finally {
      setMapLoading(false);
    }
  };

  const tourContent = tourData?.narration || `Welcome to your walking tour! We're sorry, but it seems the tour content didn't load properly. This might be because you're viewing this page directly without going through the tour generation process.

To experience a full tour:
1. Go back to the home page
2. Click "Craft New Tour"
3. Allow location access or enter your location
4. Select your interests
5. Wait for the tour to generate

Your personalized tour will include fascinating historical stories, architectural insights, and local legends tailored to your interests and location.`;

  // Show loading state while fetching tour from database
  if (loadingTour) {
    return (
      <div className="app">
        <div className="header">
          <BackButton onClick={() => navigate('/')} />
          <h3 className="header-title">Loading Tour</h3>
          <BurgerMenu />
        </div>
        <div className="container flex-center" style={{ height: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading your tour...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h3 className="header-title">
          Your Tour
        </h3>
        <BurgerMenu />
      </div>

      <div className="container">
        {/* Tour Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            padding: '16px',
            backgroundColor: 'var(--card-background)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '24px'
          }}
        >
          {/* Google Maps Screenshot */}
          <div style={{ 
            width: '100%',
            height: '120px',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: '12px',
            marginBottom: '16px',
            backgroundImage: mapUrl ? `url("${mapUrl}")` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {mapLoading ? (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                fontSize: '14px'
              }}>
                <MapPin size={20} style={{ marginBottom: '4px' }} />
                <div>Loading map...</div>
              </div>
            ) : mapError ? (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--background)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <MapPin size={20} style={{ marginBottom: '4px' }} />
                <div>{currentLocation}</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Map unavailable
                </div>
              </div>
            ) : mapUrl ? (
              // Overlay with location info when map is loaded
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#333',
                backdropFilter: 'blur(4px)'
              }}>
                <MapPin size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                {currentLocation.length > 30 ? `${currentLocation.substring(0, 30)}...` : currentLocation}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--background)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <MapPin size={20} style={{ marginBottom: '4px' }} />
                <div>{currentLocation}</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  No map available
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: 0 }}>{tourInfo.name}</h3>
          </div>
          
          <p style={{ 
            fontSize: '14px', 
            color: 'var(--text-secondary)',
            marginBottom: '12px',
            lineHeight: '1.4'
          }}>
            {tourInfo.description}
          </p>
          
          <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <MapPin size={16} />
              <span style={{ fontSize: '14px' }}>{tourInfo.distance}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Play size={16} />
              <span style={{ fontSize: '14px' }}>{playCount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Calendar size={16} />
              <span style={{ fontSize: '14px' }}>
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Play Tour Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            // Temporarily disabled - no action
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '18px 24px',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '24px',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <Play size={24} />
          Play Audio Tour
        </motion.button>

        {/* Audio Player - Hidden */}
        {false && (
          <AnimatePresence mode="wait">
            {showPlayer && (
            /* Audio Player */
            <motion.div
              key="audio-player"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundColor: 'var(--card-background)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-color)'
              }}
            >
              {/* Audio Status Messages */}
              {audioStatus === 'processing' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 size={20} color="var(--primary-color)" />
                  </motion.div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Generating Audio...
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Your tour narration is being converted to speech
                    </div>
                  </div>
                </div>
              )}

              {audioStatus === 'failed' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <VolumeX size={20} color="var(--error-color)" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Audio Unavailable
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {audioError || 'Could not generate audio'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={retryAudioGeneration}
                    disabled={isRetrying}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: isRetrying ? 'not-allowed' : 'pointer',
                      opacity: isRetrying ? 0.7 : 1
                    }}
                  >
                    <RefreshCw size={14} className={isRetrying ? 'spinning' : ''} />
                    Retry
                  </button>
                </div>
              )}

              {/* Progress Bar (only show when audio is ready) */}
              {audioStatus === 'completed' && audioUrl && (
                <>
                  <div
                    onClick={handleProgressClick}
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'var(--secondary-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginBottom: '12px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <motion.div
                      style={{
                        height: '100%',
                        backgroundColor: 'var(--primary-color)',
                        borderRadius: '4px',
                        width: `${duration ? (currentTime / duration) * 100 : 0}%`
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>

                  {/* Time Display */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '16px',
                    fontFamily: 'monospace'
                  }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </>
              )}

              {/* Player Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px'
              }}>
                {/* Skip Backward */}
                <button
                  onClick={skipBackward}
                  disabled={!isAudioReady}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'var(--secondary-color)',
                    color: isAudioReady ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: isAudioReady ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: isAudioReady ? 1 : 0.5
                  }}
                >
                  <SkipBack size={18} />
                </button>

                {/* Play/Pause Button */}
                <motion.button
                  onClick={togglePlayPause}
                  disabled={audioStatus !== 'completed' || !isAudioReady}
                  whileHover={isAudioReady ? { scale: 1.05 } : {}}
                  whileTap={isAudioReady ? { scale: 0.95 } : {}}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: audioStatus === 'completed' && isAudioReady ? 
                      (isPlaying ? 'var(--success-color)' : 'var(--primary-color)') : 
                      'var(--secondary-color)',
                    color: audioStatus === 'completed' && isAudioReady ? 'white' : 'var(--text-secondary)',
                    cursor: audioStatus === 'completed' && isAudioReady ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: audioStatus === 'completed' && isAudioReady ? 
                      '0 4px 16px rgba(99, 102, 241, 0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {audioLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 size={28} />
                    </motion.div>
                  ) : isPlaying ? (
                    <Pause size={28} />
                  ) : (
                    <Play size={28} style={{ marginLeft: '3px' }} />
                  )}
                </motion.button>

                {/* Skip Forward */}
                <button
                  onClick={skipForward}
                  disabled={!isAudioReady}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'var(--secondary-color)',
                    color: isAudioReady ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: isAudioReady ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: isAudioReady ? 1 : 0.5
                  }}
                >
                  <SkipForward size={18} />
                </button>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            backgroundColor: 'var(--card-background)',
            borderRadius: 'var(--border-radius)',
            padding: '24px',
            marginBottom: '24px',
            fontSize: '16px',
            color: 'var(--text-primary)'
          }}>
            {renderMarkdown(tourContent, handleCitationClick)}
          </div>
        </motion.div>

        {/* Sources/Citations Section */}
        {sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ marginBottom: '80px' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              color: 'var(--text-secondary)'
            }}>
              <BookOpen size={18} />
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                margin: 0,
                color: 'var(--text-primary)'
              }}>
                Sources ({sources.length})
              </h3>
            </div>
            
            <div 
              id="sources-section"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {sources.map((source, index) => {
                // Extract domain from URL for display
                let domain = '';
                let displayUrl = source;
                try {
                  const url = new URL(source);
                  domain = url.hostname.replace('www.', '');
                  // Truncate long URLs
                  displayUrl = source.length > 60 ? source.substring(0, 60) + '...' : source;
                } catch {
                  domain = 'Source';
                }
                
                return (
                  <a
                    key={index}
                    ref={(el) => { sourceRefs.current[index] = el; }}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      backgroundColor: 'var(--card-background)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{ 
                        color: 'white', 
                        fontSize: '12px', 
                        fontWeight: '600' 
                      }}>
                        {index + 1}
                      </span>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '2px'
                      }}>
                        {domain}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {displayUrl}
                      </div>
                    </div>
                    
                    <ExternalLink 
                      size={14} 
                      style={{ 
                        color: 'var(--text-secondary)',
                        flexShrink: 0
                      }} 
                    />
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>


    </div>
  );
};

export default Tour;
