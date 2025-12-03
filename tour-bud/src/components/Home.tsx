import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, CreditCard, MoreHorizontal, ChevronDown, MapPin, Camera, Sparkles, LogOut, User, Settings, UserCog, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

interface HomeProps {
  userName: string;
  credits: number;
}

interface NearbyTour {
  id: number;
  title: string;
  address: string;
  distance: string;
  duration: number;
  plays: number;
  date: Date;
}

const Home: React.FC<HomeProps> = ({ userName, credits }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mainCards = [
    {
      id: 'talk',
      title: 'Craft New Tour',
      subtitle: "Customized for your interests and location",
      icon: <Sparkles size={24} />,
      onClick: () => navigate('/location'),
      color: '#6366F1',
      textColor: '#FFFFFF'
    },
    {
      id: 'new-chat',
      title: 'Collection',
      icon: <Clock size={24} />,
      onClick: () => navigate('/past-tours'),
      color: '#10B981',
      textColor: '#FFFFFF'
    },
    {
      id: 'search',
      title: 'Buy Tours',
      icon: <CreditCard size={24} />,
      onClick: () => navigate('/buy-credits'),
      color: '#F59E0B',
      textColor: '#FFFFFF',
      isFullWidth: true
    }
  ];

  const [nearbyTours, setNearbyTours] = useState<NearbyTour[]>([
    { id: 1, title: 'Historical Downtown Walk', address: '45 Main Street, Downtown', distance: '0.3 mi', duration: 60, plays: 1247, date: new Date('2024-11-15') },
    { id: 2, title: 'Art Gallery District Tour', address: '123 Gallery Avenue, Arts District', distance: '0.5 mi', duration: 45, plays: 892, date: new Date('2024-11-20') },
    { id: 3, title: 'Local Food Experience', address: '789 Market Street, Old Town', distance: '0.7 mi', duration: 75, plays: 634, date: new Date('2024-11-25') },
    { id: 4, title: 'Waterfront Exploration', address: '321 Harbor Drive, Waterfront', distance: '1.1 mi', duration: 90, plays: 478, date: new Date('2024-11-28') }
  ]);

  const [loading, setLoading] = useState<boolean>(false);

  const additionalTours: NearbyTour[] = [
    { id: 5, title: 'Victorian Architecture Tour', address: '567 Heritage Lane, Historic District', distance: '0.8 mi', duration: 85, plays: 756, date: new Date('2024-11-30') },
    { id: 6, title: 'Hidden Speakeasy Stories', address: '234 Underground Street, Downtown', distance: '0.6 mi', duration: 55, plays: 923, date: new Date('2024-12-02') },
    { id: 7, title: 'Street Art & Murals', address: '890 Creative Avenue, Arts Quarter', distance: '1.0 mi', duration: 70, plays: 412, date: new Date('2024-12-05') },
    { id: 8, title: 'Maritime Heritage Walk', address: '456 Port Road, Harbor District', distance: '1.3 mi', duration: 95, plays: 587, date: new Date('2024-12-08') },
    { id: 9, title: 'Literary Landmarks', address: '101 Writers Way, University Area', distance: '0.9 mi', duration: 80, plays: 334, date: new Date('2024-12-10') },
    { id: 10, title: 'Market District Tour', address: '678 Commerce Street, Market Square', distance: '0.4 mi', duration: 50, plays: 789, date: new Date('2024-12-12') },
    { id: 11, title: 'Ghost Stories & Legends', address: '987 Shadow Lane, Old Quarter', distance: '1.2 mi', duration: 75, plays: 456, date: new Date('2024-12-15') },
    { id: 12, title: 'Craft Beer Trail', address: '345 Brewery Road, Industrial Zone', distance: '1.5 mi', duration: 120, plays: 672, date: new Date('2024-12-18') }
  ];

  const loadMoreTours = useCallback(() => {
    if (loading) return;
    
    setLoading(true);
    
    // Reduced delay for better UX - simulating faster API response
    setTimeout(() => {
      const currentCount = nearbyTours.length;
      const nextBatch = additionalTours.slice(currentCount - 4, currentCount);
      
      if (nextBatch.length > 0) {
        setNearbyTours((prev: NearbyTour[]) => [...prev, ...nextBatch]);
      }
      
      setLoading(false);
    }, 300); // Reduced from 1000ms to 300ms
  }, [loading, nearbyTours.length, additionalTours]);

  const handleScroll = useCallback(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    // Increased trigger distance for earlier loading
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && nearbyTours.length < 12) {
      loadMoreTours();
    }
  }, [loading, nearbyTours.length, loadMoreTours]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Placeholder for logout functionality

    setIsDropdownOpen(false);
    navigate('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="app">
      <div className="header">
        {/* Left side: TB Logo and Credits */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '700',
            color: 'white',
            flexShrink: 0
          }}>
            TB
          </div>

          <div 
            onClick={() => navigate('/buy-credits')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--secondary-color)',
              padding: '8px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            className="credits-badge-hover"
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '10px', color: 'white' }}>💎</span>
            </div>
            {credits}
          </div>
        </div>

        <div className="header-title"></div> {/* Empty title to maintain spacing */}

        {/* Right side: Profile and Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div 
              onClick={toggleDropdown}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--secondary-color)',
                backgroundImage: 'url("https://ui-avatars.com/api/?name=' + userName + '&background=6366F1&color=fff")',
                backgroundSize: 'cover',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: isDropdownOpen ? '2px solid var(--primary-color)' : '2px solid transparent',
                flexShrink: 0
              }}
            />
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '45px',
                  right: '0',
                  minWidth: '200px',
                  backgroundColor: 'var(--card-background)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '12px 0' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--secondary-color)',
                        backgroundImage: 'url("https://ui-avatars.com/api/?name=' + userName + '&background=6366F1&color=fff")',
                        backgroundSize: 'cover'
                      }} />
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--text-primary)'
                        }}>
                          {userName}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)'
                        }}>
                          {credits} credits
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}
                  className="dropdown-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/account');
                  }}
                  >
                    <UserCog size={16} />
                    Account
                  </div>
                  
                  <div style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}
                  className="dropdown-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/my-interests');
                  }}
                  >
                    <Sparkles size={16} />
                    Interests
                  </div>
                  
                  <div style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--error-color)',
                    marginTop: '8px',
                    borderTop: '1px solid var(--border-color)'
                  }}
                  className="dropdown-item-danger"
                  onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Logout
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="container">
        {/* Greeting Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ marginBottom: '40px' }}
        >
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: '700',
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            Hello {userName}
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Let's get you touring!
          </p>
        </motion.div>

        {/* Main Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '16px',
          marginBottom: '48px',
          height: '320px'
        }}>
          {/* Talk with Cooper - Large card on left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0 }}
            style={{
              gridColumn: '1',
              gridRow: '1 / 3'
            }}
          >
                          <button
              onClick={mainCards[0].onClick}
              style={{
                width: '100%',
                height: '100%',
                background: mainCards[0].color,
                border: 'none',
                borderRadius: '24px',
                padding: '24px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
              className="home-card-hover"
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mainCards[0].textColor
              }}>
                {mainCards[0].icon}
              </div>
              
              <div style={{ textAlign: 'left' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: mainCards[0].textColor,
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  {mainCards[0].title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: mainCards[0].textColor,
                  opacity: 0.7,
                  margin: 0
                }}>
                  {mainCards[0].subtitle}
                </p>
              </div>
            </button>
          </motion.div>

          {/* New chat - Top right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{
              gridColumn: '2',
              gridRow: '1'
            }}
          >
            <button
              onClick={mainCards[1].onClick}
              style={{
                width: '100%',
                height: '100%',
                background: mainCards[1].color,
                border: 'none',
                borderRadius: '24px',
                padding: '24px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
              className="home-card-hover"
            >
              
              
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mainCards[1].textColor
              }}>
                {mainCards[1].icon}
              </div>
              
              <div style={{ textAlign: 'left' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: mainCards[1].textColor,
                  margin: 0
                }}>
                  {mainCards[1].title}
                </h3>
              </div>
            </button>
          </motion.div>

          {/* Search by image - Bottom right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              gridColumn: '2',
              gridRow: '2'
            }}
          >
            <button
              onClick={mainCards[2].onClick}
              style={{
                width: '100%',
                height: '100%',
                background: mainCards[2].color,
                border: 'none',
                borderRadius: '24px',
                padding: '24px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
              className="home-card-hover"
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mainCards[2].textColor
              }}>
                {mainCards[2].icon}
              </div>
              
              <div style={{ textAlign: 'left' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: mainCards[2].textColor,
                  margin: 0
                }}>
                  {mainCards[2].title}
                </h3>
              </div>
            </button>
          </motion.div>
        </div>

        {/* Nearby Tours Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Nearby Tours
            </h2>
          </div>

          <div>
            {nearbyTours.map((tour: NearbyTour, index: number) => {
              // Only add staggered delay for initial cards (first 4), new cards should animate immediately
              const isInitialCard = index < 4;
              const animationDelay = isInitialCard ? 0.5 + index * 0.1 : 0;
              
              return (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: animationDelay }}
                  onClick={() => navigate(`/tour/${tour.id}`)}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--card-background)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: index === nearbyTours.length - 1 ? '0' : '16px'
                  }}
                  className="tour-list-item-motion"
                >
                  <div style={{ marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: 0 }}>{tour.title}</h3>
                  </div>
                  
                  <p style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-secondary)',
                    marginBottom: '12px',
                    lineHeight: '1.4'
                  }}>
                    {tour.address}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <MapPin size={16} />
                      <span style={{ fontSize: '14px' }}>{tour.distance}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Play size={16} />
                      <span style={{ fontSize: '14px' }}>{tour.plays.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Calendar size={16} />
                      <span style={{ fontSize: '14px' }}>
                        {tour.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Skeleton loading cards to prevent visual gap */}
            {loading && (
              <>
                {[1, 2, 3, 4].map((skeletonIndex) => (
                  <motion.div
                    key={`skeleton-${skeletonIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: skeletonIndex * 0.05 }}
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--card-background)',
                      borderRadius: '16px',
                      marginBottom: skeletonIndex === 4 ? '0' : '16px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {/* Skeleton title */}
                    <div style={{
                      height: '20px',
                      backgroundColor: 'var(--secondary-color)',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      width: '70%',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                    
                    {/* Skeleton description */}
                    <div style={{
                      height: '14px',
                      backgroundColor: 'var(--secondary-color)',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      width: '90%',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: '0.2s'
                    }} />
                    <div style={{
                      height: '14px',
                      backgroundColor: 'var(--secondary-color)',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      width: '75%',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: '0.4s'
                    }} />
                    
                    {/* Skeleton metadata */}
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{
                        height: '14px',
                        backgroundColor: 'var(--secondary-color)',
                        borderRadius: '4px',
                        width: '60px',
                        animation: 'pulse 1.5s ease-in-out infinite',
                        animationDelay: '0.6s'
                      }} />
                      <div style={{
                        height: '14px',
                        backgroundColor: 'var(--secondary-color)',
                        borderRadius: '4px',
                        width: '50px',
                        animation: 'pulse 1.5s ease-in-out infinite',
                        animationDelay: '0.8s'
                      }} />
                      <div style={{
                        height: '14px',
                        backgroundColor: 'var(--secondary-color)',
                        borderRadius: '4px',
                        width: '45px',
                        animation: 'pulse 1.5s ease-in-out infinite',
                        animationDelay: '1s'
                      }} />
                    </div>
                  </motion.div>
                ))}
              </>
            )}
            
            {loading && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: 'var(--text-secondary)'
              }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '12px', fontSize: '14px' }}>Loading more tours...</p>
              </div>
            )}
          </div>
        </motion.div>


      </div>
    </div>
  );
};

export default Home; 