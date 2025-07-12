import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

const StatusBar: React.FC = () => {
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <div className="status-bar">
      <div className="status-bar-time">{currentTime}</div>
      <div className="status-bar-icons">
        <Signal size={16} />
        <Wifi size={16} />
        <Battery size={16} />
      </div>
    </div>
  );
};

export default StatusBar; 