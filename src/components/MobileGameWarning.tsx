import React, { useEffect, useState } from 'react';

interface MobileGameWarningProps {
  onClose?: () => void;
}

const MobileGameWarning: React.FC<MobileGameWarningProps> = ({ onClose }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const touchCheck = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const screenCheck = window.innerWidth < 768;

      setIsMobile(mobileCheck || (touchCheck && screenCheck));
    };

    // Check if already dismissed in this session
    if (sessionStorage.getItem('mobileWarningDismissed')) {
      setIsDismissed(true);
    }

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('mobileWarningDismissed', 'true');
    if (onClose) onClose();
  };

  if (!isMobile || isDismissed) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: '#0ff',
      padding: '30px',
      borderRadius: '10px',
      textAlign: 'center',
      fontFamily: '"Orbitron", monospace',
      zIndex: 1000,
      border: '2px solid #0ff',
      boxShadow: '0 0 20px #0ff',
      maxWidth: '90%',
      width: '350px'
    }}>
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'transparent',
          border: '1px solid #0ff',
          color: '#0ff',
          cursor: 'pointer',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '14px'
        }}
      >
        ✕
      </button>
      <h3 style={{
        fontSize: '20px',
        marginBottom: '15px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        Desktop Recommended
      </h3>
      <p style={{
        fontSize: '14px',
        marginBottom: '20px',
        lineHeight: '1.5',
        opacity: 0.9
      }}>
        Cell Break is designed for desktop play with keyboard and mouse controls for the best experience.
      </p>
      <button
        onClick={handleDismiss}
        style={{
          background: '#0ff',
          color: '#000',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
          textTransform: 'uppercase'
        }}
      >
        Continue Anyway
      </button>
    </div>
  );
};

export default MobileGameWarning;