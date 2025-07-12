import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, ChevronRight, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import BackButton from './BackButton';

const Tour: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [timeRemaining, setTimeRemaining] = useState(45); // minutes
  const [isPlaying, setIsPlaying] = useState(false);

  // Tour information
  const tourInfo = {
    name: 'Historical Downtown Walk',
    description: 'Explore the city\'s founding stories and colonial architecture',
    distance: '0.8 mi',
    duration: 45,
    plays: 1247
  };

  const tourContent = `We should start back," Gorod urged as the woods began to grow dark around them. "The wildlings are dead."

"Do the dead frighten you?" Ser Waymar Royce asked with just the hint of a smile.

Gorod did not rise to the bait. He was an old man, past fifty, and he had seen the lordlings come and go. "Dead is dead," he said. "We have no business with the dead."

"Are they dead?" Royce asked softly. "What proof have we?"

"Will saw them," Gorod said. "If he says they are dead, that's proof enough for me."

Will had known they would drag him into the quarrel sooner or later. He wished it had been later rather than sooner. "My mother told me that dead men sing no songs," he put in.

"My wet nurse said the same thing, Will," Royce replied. "Never believe anything you hear at a woman's tit. There are things to be learned even from the dead." His voice echoed, too loud in the twilight forest.

"We have a long ride before us," Gorod pointed out. "Eight days, maybe nine. And night is falling."

Ser Waymar Royce glanced at the sky with disinterest. "It does that every day about this time. Are you unmanned by the dark, Gorod?"`;

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

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h3 className="header-title">
          45 Smith Street
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
            backgroundImage: 'url("https://maps.googleapis.com/maps/api/staticmap?center=45+Smith+Street,+New+York,+NY&zoom=16&size=400x120&maptype=roadmap&markers=color:red%7C45+Smith+Street,+New+York,+NY&key=YOUR_API_KEY")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ 
              textAlign: 'center', 
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--background)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <MapPin size={20} style={{ marginBottom: '4px' }} />
              <div>45 Smith Street</div>
              <div style={{ fontSize: '12px' }}>New York, NY</div>
            </div>
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
              <Clock size={16} />
              <span style={{ fontSize: '14px' }}>{tourInfo.duration} min</span>
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
            marginBottom: '80px'
          }}>
            <p style={{ 
              fontSize: '16px', 
              lineHeight: '1.8',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap'
            }}>
              {tourContent}
            </p>
          </div>
        </motion.div>
      </div>


    </div>
  );
};

export default Tour;
