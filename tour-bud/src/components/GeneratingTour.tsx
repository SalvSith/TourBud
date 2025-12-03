import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Check, AlertCircle, Globe, CheckCircle, Clock, Sparkles } from 'lucide-react';
import tourService from '../services/tourService';

interface LoadingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const GeneratingTour: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef<boolean>(false);

  // Get location, interests, and selected places from navigation state
  const { coordinates, interests, geocodeData, selectedPlaces, nearbyPlaces } = location.state || {};

  // 3 simple stages for Perplexity research
  const steps: LoadingStep[] = [
    {
      id: 1,
      title: "Searching",
      description: "Finding info about your location and places",
      icon: <Search size={24} />,
    },
    {
      id: 2,
      title: "Researching",
      description: "Reading through sources and gathering facts",
      icon: <Globe size={24} />,
    },
    {
      id: 3,
      title: "Writing",
      description: "Creating your personalized tour content",
      icon: <CheckCircle size={24} />,
    }
  ];

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the elapsed time counter
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
  }, []);
  
  // Progress through steps on a fixed schedule (independent of API)
  useEffect(() => {
    if (!isGenerating) return;
    
    // Step 1: After 3 seconds, move to "Researching"
    const step1Timer = setTimeout(() => {
      setCompletedSteps([0]);
      setCurrentStep(1);
    }, 3000);
    
    // Step 2: After 25 seconds, move to "Writing"
    const step2Timer = setTimeout(() => {
      setCompletedSteps([0, 1]);
      setCurrentStep(2);
    }, 25000);
    
    return () => {
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
    };
  }, [isGenerating]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!coordinates || !interests || !geocodeData || !selectedPlaces) {
      setError('Missing location, interests, or selected places data');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    // Prevent duplicate calls (React strict mode, rerenders, etc.)
    if (hasStartedRef.current || isGenerating) {
      return;
    }
    hasStartedRef.current = true;
    
    generateTourWithPerplexity();
  }, [coordinates, interests, geocodeData, selectedPlaces]);

  const generateTourWithPerplexity = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    startTimer();

    try {
      setCurrentStep(0);

      // Use Perplexity - it's synchronous (no polling needed)
      const tourData = await tourService.generatePerplexityTour(
        { ...geocodeData, latitude: coordinates.latitude, longitude: coordinates.longitude },
        selectedPlaces,
        interests,
        nearbyPlaces || []
      );

      // Mark all 3 steps complete
      setCompletedSteps([0, 1, 2]);
      setCurrentStep(2);
      
      await new Promise(resolve => setTimeout(resolve, 800));

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Navigate to tour page
      navigate('/tour', {
        state: {
          tourId: tourData.tourId,
          tourData: tourData,
          location: geocodeData.formattedAddress,
          researchTime: elapsedTime
        }
      });

    } catch (err) {
      console.error('Perplexity tour generation error:', err);
      
      if (timerRef.current) clearInterval(timerRef.current);
      
      setError(err instanceof Error ? err.message : 'Failed to generate tour');
    }
  };

  const getStepState = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'upcoming';
  };

  const getStepStyles = (stepIndex: number) => {
    const state = getStepState(stepIndex);
    
    switch (state) {
      case 'completed':
        return {
          border: '2px solid var(--success-color)',
          opacity: 0.7,
          boxShadow: '0 4px 16px rgba(34, 197, 94, 0.1)'
        };
      case 'active':
        return {
          border: '2px solid var(--primary-color)',
          opacity: 1,
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)'
        };
      default:
        return {
          border: '2px solid var(--border-color)',
          opacity: 0.5,
          boxShadow: 'none'
        };
    }
  };

  const getIconStyles = (stepIndex: number) => {
    const state = getStepState(stepIndex);
    
    switch (state) {
      case 'completed':
        return {
          backgroundColor: 'var(--success-color)',
          color: 'white'
        };
      case 'active':
        return {
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)'
        };
      default:
        return {
          backgroundColor: 'var(--border-color)',
          color: 'var(--text-secondary)'
        };
    }
  };

  if (error) {
    return (
      <div className="app">
        <div className="container flex-center" style={{ height: '100vh', padding: '40px 20px' }}>
          <div className="text-center" style={{ maxWidth: '400px' }}>
            <AlertCircle size={48} color="var(--error-color)" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Research Failed</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Please try again. If the issue persists, try a different location.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/')}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container flex-center" style={{ minHeight: '100vh', padding: '40px 20px' }}>
        <div className="text-center" style={{ width: '100%', maxWidth: '520px' }}>
          
          {/* Header with Timer */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
              <Sparkles size={28} color="var(--primary-color)" />
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Researching History
              </h2>
            </div>
            <p style={{ 
              fontSize: '16px',
              color: 'var(--text-secondary)',
              margin: '0 0 16px 0'
            }}>
              Creating your comprehensive historical tour
            </p>
            
            {/* Elapsed Time */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--card-background)',
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <Clock size={16} color="var(--primary-color)" />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: 'var(--text-primary)',
                fontFamily: 'monospace'
              }}>
                {formatTime(elapsedTime)}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                elapsed
              </span>
            </div>
          </div>

          {/* Steps List */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: '32px' }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    backgroundColor: 'var(--card-background)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.3s ease',
                    ...getStepStyles(index)
                  }}
                >
                  {/* Step Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    ...getIconStyles(index),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.3s ease'
                  }}>
                    {completedSteps.includes(index) ? <Check size={20} /> : step.icon}
                  </div>

                  {/* Step Content */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      margin: '0 0 2px 0'
                    }}>
                      {step.title}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      {step.description}
                    </p>
                  </div>

                  {/* Active indicator */}
                  {getStepState(index) === 'active' && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-color)'
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer Message */}
          <div style={{ 
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <p style={{ 
              fontSize: '13px',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              💡 Usually takes <strong>30-60 seconds</strong> to research and write your tour.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratingTour;
