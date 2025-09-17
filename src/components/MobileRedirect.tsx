import React, { useEffect, useState } from 'react';

const MobileRedirect: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const touchCheck = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const screenCheck = window.innerWidth < 768;

      setIsMobile(mobileCheck || (touchCheck && screenCheck));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      color: '#0ff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center',
      fontFamily: '"Orbitron", monospace',
      zIndex: 9999999,
      backgroundImage: 'radial-gradient(circle at center, #001122 0%, #000 100%)'
    }}>
      <div style={{
        border: '2px solid #0ff',
        padding: '40px',
        borderRadius: '10px',
        maxWidth: '90%',
        boxShadow: '0 0 30px #0ff',
        backgroundColor: 'rgba(0, 17, 34, 0.9)'
      }}>
        <h1 style={{
          fontSize: '28px',
          marginBottom: '20px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          animation: 'pulse 2s infinite'
        }}>
          Desktop Only
        </h1>
        <p style={{
          fontSize: '18px',
          marginBottom: '30px',
          lineHeight: '1.5'
        }}>
          This game requires a desktop computer with keyboard and mouse controls.
        </p>
        <p style={{
          fontSize: '16px',
          opacity: 0.8
        }}>
          Please visit on a desktop browser to play Cell Break.
        </p>
        <div style={{
          marginTop: '30px',
          fontSize: '14px',
          opacity: 0.6
        }}>
          Minimum screen width: 768px
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default MobileRedirect;