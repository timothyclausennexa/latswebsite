import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Ticker from './components/Ticker';
import TheHook from './components/TheHook';
import CoreLoop from './components/CoreLoop';
import HowItWorks from './components/HowItWorks';
import Leaderboard from './components/Leaderboard';
import HighStakes from './components/HighStakes';
import Roadmap from './components/Roadmap';
import Tokenomics from './components/Tokenomics';
import Manifesto from './components/Manifesto';
import GameSection from './components/GameSection';
import MusicSection from './components/MusicSection';
import Community from './components/Community';
import TechDetails from './components/TechDetails';
import Safety from './components/Safety';
import Faq from './components/Faq';
import Footer from './components/Footer';
import EntryModal from './components/EntryModal';
import PixelDust, { PixelDustHandle } from './components/PixelDust';
import { AuthProvider } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import FunctionalShop from './components/FunctionalShop';
import ProfileModal from './components/ProfileModal';
import AdminDashboard from './components/AdminDashboard';
import { DeviceDetector, HapticFeedback } from './utils/touchUtils';

const App: React.FC = () => {
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isShopModalOpen, setIsShopModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
    const pixelDustRef = useRef<PixelDustHandle>(null);

    // Touch device detection and optimization
    const [isTouch, setIsTouch] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isModernIPhone, setIsModernIPhone] = useState(false);

    // Initialize touch device detection and optimizations
    useEffect(() => {
        if (sessionStorage.getItem('siteEntered')) {
            setIsEntryModalOpen(false);
        }

        // Detect device capabilities
        setIsTouch(DeviceDetector.isTouchDevice());
        setIsIOS(DeviceDetector.isIOS());
        setIsModernIPhone(DeviceDetector.isModernIPhone());

        // Add device-specific CSS classes to body
        const body = document.body;
        if (DeviceDetector.isTouchDevice()) {
            body.classList.add('touch-device');
        }
        if (DeviceDetector.isIOS()) {
            body.classList.add('ios-device');
        }
        if (DeviceDetector.isModernIPhone()) {
            body.classList.add('modern-iphone');
        }

        // Prevent bounce scrolling on iOS
        if (DeviceDetector.isIOS()) {
            body.style.overscrollBehavior = 'none';
        }

        // Set viewport meta tag for optimal mobile experience
        let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        if (DeviceDetector.isModernIPhone()) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        } else {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }

        return () => {
            body.classList.remove('touch-device', 'ios-device', 'modern-iphone');
        };
    }, []);

    const handleCloseEntryModal = () => {
        sessionStorage.setItem('siteEntered', 'true');
        setIsEntryModalOpen(false);
    };

    const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        pixelDustRef.current?.fire(event.clientX, event.clientY);

        // Add haptic feedback for touch devices
        if (isTouch) {
            HapticFeedback.trigger('impactLight');
        }
    };

    return (
        <AuthProvider>
            <div
                className={`bg-prison-dark text-ash-white touch-smooth ${isModernIPhone ? 'safe-area-all' : ''} ${isTouch ? 'touch-optimized ios-optimized' : ''}`}
                onClick={(e) => {
                    if ((e.target as HTMLElement).tagName === 'BUTTON') {
                        handleButtonClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
                    }
                }}
            >
                <PixelDust ref={pixelDustRef} />
                <EntryModal isOpen={isEntryModalOpen} onClose={handleCloseEntryModal} />
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
                <FunctionalShop isOpen={isShopModalOpen} onClose={() => setIsShopModalOpen(false)} />
                <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
                <AdminDashboard isOpen={isAdminDashboardOpen} onClose={() => setIsAdminDashboardOpen(false)} />

                <div className={`${isEntryModalOpen ? 'blur-sm' : ''} ${isTouch ? 'touch-scroll ios-scroll' : ''}`}>
                    <Header
                        onAuthClick={() => setIsAuthModalOpen(true)}
                        onShopClick={() => setIsShopModalOpen(true)}
                        onProfileClick={() => setIsProfileModalOpen(true)}
                        onAdminClick={() => setIsAdminDashboardOpen(true)}
                    />
                    <Ticker />
                    <main>
                        <TheHook />
                        <CoreLoop />
                        <HowItWorks />
                        <Leaderboard />
                        <GameSection />
                        <MusicSection />
                        <HighStakes />
                        <Roadmap />
                        <Manifesto />
                        <Tokenomics />
                        <TechDetails />
                        <Community />
                        <Faq />
                        <Safety />
                    </main>
                    <Footer />
                </div>
            </div>
        </AuthProvider>
    );
};

export default App;
