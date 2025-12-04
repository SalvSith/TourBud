import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, UserCog, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface BurgerMenuProps {
  userName?: string;
  credits?: number;
  showUserInfo?: boolean;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ userName, credits, showUserInfo = false }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleTheme } = useTheme();

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
    setIsDropdownOpen(false);
    navigate('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div 
        onClick={toggleDropdown}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: isDropdownOpen ? 'var(--primary-color)' : 'var(--secondary-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flexShrink: 0
        }}
      >
        <Menu size={20} color={isDropdownOpen ? 'white' : 'var(--text-primary)'} />
      </div>
      
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
          <div style={{ padding: '6px 0' }}>
            {/* User Info Section - Only show if requested */}
            {showUserInfo && userName && (
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '4px'
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
                    backgroundImage: `url("https://ui-avatars.com/api/?name=${userName}&background=6366F1&color=fff")`,
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
                    {credits !== undefined && (
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                      }}>
                        {credits} credits
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Account Menu Item */}
            <div style={{
              padding: '10px 16px',
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
            
            {/* Theme Toggle Menu Item */}
            <div style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}
            className="dropdown-item"
            onClick={() => {
              toggleTheme();
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </div>
              <div style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: isDarkMode ? 'var(--primary-color)' : 'var(--border-color)',
                position: 'relative',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  position: 'absolute',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  top: '3px',
                  left: isDarkMode ? '23px' : '3px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }} />
              </div>
            </div>
            
            {/* Logout Menu Item */}
            <div style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--error-color)',
              marginTop: '4px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '14px'
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
  );
};

export default BurgerMenu;

