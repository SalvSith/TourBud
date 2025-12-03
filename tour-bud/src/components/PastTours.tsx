import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Play, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import BackButton from './BackButton';
import { Tour } from '../types';

interface PastTour extends Tour {
  address: string;
  distance: string;
  plays: number;
}

const PastTours: React.FC = () => {
  const navigate = useNavigate();
  
  const pastTours: PastTour[] = [
    { 
      id: '1', 
      title: 'Historical Downtown Walk', 
      address: '45 Smith Street, Downtown',
      location: '45 Smith Street',
      distance: '0.8 mi',
      duration: 45,
      plays: 1247,
      content: '',
      createdAt: new Date('2024-01-15'),
      completedAt: new Date('2024-01-15')
    },
    { 
      id: '2', 
      title: 'Art Gallery District Tour', 
      address: '42 Main Street, Arts District',
      location: '42 Main Street',
      distance: '1.2 mi',
      duration: 60,
      plays: 892,
      content: '',
      createdAt: new Date('2024-01-10'),
      completedAt: new Date('2024-01-10')
    },
    { 
      id: '3', 
      title: 'Local Food Experience', 
      address: '18 Park Avenue, Old Town',
      location: '18 Park Avenue',
      distance: '0.5 mi',
      duration: 75,
      plays: 634,
      content: '',
      createdAt: new Date('2024-01-05'),
      completedAt: new Date('2024-01-05')
    },
    { 
      id: '4', 
      title: 'Waterfront Exploration', 
      address: '101 Harbor Drive, Waterfront',
      location: '101 Harbor Drive',
      distance: '1.8 mi',
      duration: 90,
      plays: 478,
      content: '',
      createdAt: new Date('2024-01-01'),
      completedAt: new Date('2024-01-01')
    }
  ];

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h2 className="header-title">My Tour Collection</h2>
        <ThemeToggle />
      </div>

      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {pastTours.map((tour, index) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => navigate(`/tour/${tour.id}`)}
              style={{
                padding: '16px',
                backgroundColor: 'var(--card-background)',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: index === pastTours.length - 1 ? '0' : '16px'
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
                    {tour.createdAt?.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/')}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default PastTours;
