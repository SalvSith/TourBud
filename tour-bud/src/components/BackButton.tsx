import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, className, style }) => {
  return (
    <button 
      className={`back-button-hover ${className || ''}`}
      onClick={onClick}
      style={{
        background: 'var(--card-background)',
        borderRadius: '25px',
        padding: '6px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <ArrowLeft size={18} color="var(--text-primary)" />
    </button>
  );
};

export default BackButton; 