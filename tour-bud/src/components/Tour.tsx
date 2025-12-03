import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, MapPin, ExternalLink, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import BackButton from './BackButton';
import { SUPABASE_CONFIG } from '../config/supabase';

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
  const [timeRemaining, setTimeRemaining] = useState(45); // minutes
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const sourceRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);

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

  // Get tour data from navigation state
  const { tourData, location: tourLocation } = location.state || {};
  
  // Get citations/sources from tour data
  const sources: string[] = tourData?.sources || [];

  // Use actual tour data or fallback to defaults
  const tourInfo = tourData ? {
    name: tourData.title,
    description: tourData.description,
    distance: tourData.distance,
    duration: tourData.estimatedDuration,
    plays: Math.floor(Math.random() * 2000) + 500 // Random play count for demo
  } : {
    name: 'Historical Downtown Walk',
    description: 'Explore the city\'s founding stories and colonial architecture',
    distance: '0.8 mi',
    duration: 45,
    plays: 1247
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

  // Fetch map URL when component mounts or location changes
  useEffect(() => {
    if (currentLocation) {
      fetchMapUrl(currentLocation);
    }
  }, [currentLocation]);

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h3 className="header-title">
          {shortLocation}
        </h3>
        <ThemeToggle />
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
              <span style={{ fontSize: '14px' }}>{tourInfo.plays.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        <motion.button 
          className="btn btn-primary"
          onClick={() => setIsPlaying(!isPlaying)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            marginBottom: '24px',
            backgroundColor: isPlaying ? 'var(--success-color)' : 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          {isPlaying ? 'Pause Tour' : 'Start Tour'}
        </motion.button>

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
