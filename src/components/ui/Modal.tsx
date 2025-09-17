import React, { useEffect } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup on component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-prison-black/80 backdrop-blur-sm"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      <div
        className="relative mx-4 w-full max-w-lg border-4 border-alarm-red bg-prison-black p-6 shadow-pixel-xl shadow-alarm-red/30"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        <div className="flex items-start justify-between border-b-2 border-alarm-red/30 pb-3">
          <h2 id="modal-title" className="font-pixel-heading text-xl text-alarm-red">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-ash-white/50 transition-colors hover:text-ash-white"
            aria-label="Close"
          >
            <Icon type="x-close" className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  );
};
