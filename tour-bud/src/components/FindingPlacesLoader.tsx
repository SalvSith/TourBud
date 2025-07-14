import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Wifi, Database, CheckCircle } from 'lucide-react';

interface FindingPlacesLoaderProps {
  streetName: string;
}

interface LoadingStage {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
}

const FindingPlacesLoader: React.FC<FindingPlacesLoaderProps> = ({ streetName }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const stages: LoadingStage[] = [
    {
      id: 0,
      title: "Connecting to Google Maps",
      description: "Connecting to location services",
      icon: <Wifi size={24} />,
      duration: 1500
    },
    {
      id: 1,
      title: "Scanning Your Area",
      description: "Finding nearby businesses",
      icon: <Search size={24} />,
      duration: 3000
    },
    {
      id: 2,
      title: "Gathering Place Details", 
      description: "Getting ratings and reviews",
      icon: <Database size={24} />,
      duration: 2500
    },
    {
      id: 3,
      title: "Organizing Results",
      description: "Filtering the best options",
      icon: <CheckCircle size={24} />,
      duration: 1000
    }
  ];

  useEffect(() => {
    if (currentStage >= stages.length) return;

    const stage = stages[currentStage];
    const totalDuration = stage.duration;
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const stageProgressPercent = Math.min((elapsed / totalDuration) * 100, 100);
      
      // Calculate overall progress
      const stagesCompleted = currentStage;
      const currentStageProgress = stageProgressPercent / 100;
      const overallProgress = ((stagesCompleted + currentStageProgress) / stages.length) * 100;
      setProgress(overallProgress);

      if (elapsed >= totalDuration) {
        clearInterval(progressInterval);
        if (currentStage < stages.length - 1) {
          setCurrentStage(currentStage + 1);
        }
      }
    }, 50);

    return () => clearInterval(progressInterval);
  }, [currentStage]);

  return (
    <div className="finding-places-loader">
      <div className="loader-content">
        
        {/* Main Icon with Animation */}
        <motion.div 
          className="main-icon-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="main-icon-bg"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(79, 70, 229, 0.3)',
                '0 0 40px rgba(79, 70, 229, 0.5)',
                '0 0 20px rgba(79, 70, 229, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <MapPin size={32} />
          </motion.div>
        </motion.div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-bar-container">
            <motion.div 
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
            <div className="progress-bar-bg" />
          </div>
          <div className="progress-text">
            {Math.round(progress)}% Complete
          </div>
        </div>

                 {/* Current Stage Info */}
         <AnimatePresence mode="wait">
           <motion.div
             key={currentStage}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             transition={{ duration: 0.4 }}
             className="stage-info"
           >
             <h3 className="stage-title">
               {stages[currentStage]?.title}
             </h3>
             
             <p className="stage-description">
               {stages[currentStage]?.description}
             </p>
           </motion.div>
         </AnimatePresence>

        {/* Location Info */}
        <motion.div 
          className="location-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="location-text">
            Searching near <strong>{streetName}</strong>
          </div>
        </motion.div>

      </div>

      <style>{`
        .finding-places-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 120px);
          padding: 20px;
          position: relative;
        }

        .loader-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 400px;
          width: 100%;
        }

        .main-icon-container {
          margin-bottom: 40px;
        }

        .main-icon-bg {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--primary-color), #6366f1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
        }

                 .progress-section {
           width: 70%;
           margin-bottom: 30px;
         }

        .progress-bar-container {
          position: relative;
          width: 100%;
          height: 8px;
          margin-bottom: 12px;
        }

        .progress-bar-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--secondary-color);
          border-radius: 4px;
        }

        .progress-bar-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, var(--primary-color), #6366f1);
          border-radius: 4px;
          box-shadow: 0 0 10px rgba(79, 70, 229, 0.4);
          z-index: 1;
        }

        .progress-text {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-color);
        }

                 .stage-info {
           margin-bottom: 30px;
           padding: 0 20px;
         }

         .stage-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 8px 0;
          line-height: 1.3;
        }

        .stage-description {
          font-size: 16px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
        }

                 .location-info {
           margin-bottom: 20px;
           padding: 16px 24px;
           background: var(--card-background);
           border: 1px solid var(--border-color);
           border-radius: 12px;
           box-shadow: var(--shadow-sm);
         }

        .location-text {
          font-size: 14px;
          color: var(--text-secondary);
        }

                 .location-text strong {
           color: var(--text-primary);
           font-weight: 600;
         }
      `}</style>
    </div>
  );
};

export default FindingPlacesLoader; 