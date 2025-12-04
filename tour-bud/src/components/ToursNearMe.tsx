import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import BurgerMenu from './BurgerMenu';
import BackButton from './BackButton';

interface NearbyTour {
  id: string;
  title: string;
  description: string;
  distance: string;
  duration: number;
  rating: number;
  plays: number;
}

const ToursNearMe: React.FC = () => {
  const navigate = useNavigate();
  
  const nearbyTours: NearbyTour[] = [
    { id: '1', title: 'Historic Downtown Walk', description: 'Explore the city\'s founding stories and colonial architecture', distance: '0.3 mi', duration: 60, rating: 4.8, plays: 1247 },
    { id: '2', title: 'Riverside Park Tour', description: 'Nature walk through scenic waterfront trails and gardens', distance: '0.5 mi', duration: 45, rating: 4.6, plays: 892 },
    { id: '3', title: 'Museum District Guide', description: 'Cultural journey through world-class art and history museums', distance: '0.8 mi', duration: 90, rating: 4.9, plays: 2104 },
    { id: '4', title: 'Old Town Stories', description: 'Discover local legends and tales from centuries past', distance: '1.2 mi', duration: 75, rating: 4.7, plays: 758 },
    { id: '5', title: 'City Architecture Tour', description: 'Marvel at stunning buildings from Victorian to modern era', distance: '1.5 mi', duration: 120, rating: 4.5, plays: 634 }
  ];

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h2 className="header-title">Tours Near Me</h2>
        <BurgerMenu />
      </div>

      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-4">
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              Based on your current location
            </p>
          </div>

          {nearbyTours.map((tour, index) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="card-motion"
              onClick={() => navigate('/interests')}
              style={{ 
                cursor: 'pointer',
                marginBottom: '16px',
                backgroundColor: 'var(--card-background)',
                borderRadius: 'var(--border-radius)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}
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
                {tour.description}
              </p>
              
              <div className="flex" style={{ gap: '16px', color: 'var(--text-secondary)' }}>
                <div className="flex" style={{ gap: '4px', alignItems: 'center' }}>
                  <MapPin size={16} />
                  <span style={{ fontSize: '14px' }}>{tour.distance}</span>
                </div>
                <div className="flex" style={{ gap: '4px', alignItems: 'center' }}>
                  <Clock size={16} />
                  <span style={{ fontSize: '14px' }}>{tour.duration} min</span>
                </div>
                <div className="flex" style={{ gap: '4px', alignItems: 'center' }}>
                  <Play size={16} />
                  <span style={{ fontSize: '14px' }}>{tour.plays.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default ToursNearMe;
