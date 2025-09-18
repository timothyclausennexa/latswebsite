import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import StreamerOverlay from './components/StreamerOverlay';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Check if we should render the overlay instead
if (window.location.pathname === '/overlay') {
  root.render(
    <React.StrictMode>
      <StreamerOverlay />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}