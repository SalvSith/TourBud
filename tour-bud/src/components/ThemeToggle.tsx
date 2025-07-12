import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, style }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div 
      className={className}
      style={{
        background: 'var(--card-background)',
        borderRadius: '25px',
        padding: '6px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        width: '70px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        ...style
      }}
      onClick={toggleTheme}
    >
      {/* Sliding background circle */}
      <div 
        style={{
          position: 'absolute',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: 'var(--background)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.3s ease',
          transform: isDarkMode ? 'translateX(32px)' : 'translateX(0px)',
          left: '6px',
          zIndex: 1
        }}
      />

      {/* Fixed Sun icon position - always on left */}
      <div 
        style={{
          position: 'absolute',
          left: '6px',
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDarkMode ? 0.4 : 1,
          transition: 'all 0.3s ease',
          zIndex: 2
        }}
      >
        <Sun size={14} color={isDarkMode ? "var(--text-secondary)" : "var(--text-primary)"} />
      </div>

      {/* Fixed Moon icon position - always on right */}
      <div 
        style={{
          position: 'absolute',
          right: '4px',
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDarkMode ? 1 : 0.4,
          transition: 'all 0.3s ease',
          zIndex: 2
        }}
      >
        <Moon size={14} color={isDarkMode ? "var(--text-primary)" : "var(--text-secondary)"} />
      </div>
    </div>
  );
};

export default ThemeToggle; 