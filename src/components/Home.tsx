import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Clock, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBar from './StatusBar';

interface HomeProps {
  userName: string;
  credits: number;
}

const Home: React.FC<HomeProps> = ({ userName, credits }) => {
  const navigate = useNavigate();

  const menuItems = [
    { 
      icon: <Plus size={24} />, 
      label: 'Generate Tour', 
      onClick: () => navigate('/interests'),
      color: '#4F46E5'
    },
    { 
      icon: <Clock size={24} />, 
      label: 'My Past Tours', 
      onClick: () => navigate('/past-tours'),
      color: '#10B981'
    },
    { 
      icon: <MapPin size={24} />, 
      label: 'Tours Near Me', 
      onClick: () => navigate('/nearby'),
      color: '#F59E0B'
    },
    { 
      icon: <CreditCard size={24} />, 
      label: 'Buy Credits', 
      onClick: () => navigate('/buy-credits'),
      color: '#EF4444'
    }
  ];

  return (
    <div className="app">
      <StatusBar />
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex-between mb-4">
            <div className="credits-badge">
              <CreditCard size={16} />
              {credits} Credits
            </div>
          </div>

          <h1 style={{ marginTop: '40px', marginBottom: '8px' }}>
            Hi {userName},
          </h1>
          <h1 style={{ marginTop: 0 }}>
            Let's get you touring!
          </h1>

          <div className="grid grid-2" style={{ marginTop: '60px', gap: '20px' }}>
            {menuItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <button
                  className="card"
                  onClick={item.onClick}
                  style={{
                    width: '100%',
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: 'var(--card-background)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: item.color + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color
                    }}
                  >
                    {item.icon}
                  </div>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    {item.label}
                  </span>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home; 