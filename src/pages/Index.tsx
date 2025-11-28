import { useState, lazy, Suspense, useEffect, useCallback, memo } from 'react';
import { StrangerThingsIntro } from '@/components/StrangerThingsIntro';
import { SEOHead } from '@/components/SEOHead';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { deferWork } from '@/lib/preload';

import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy load background effects with lower priority - with error handling
const AtmosphericBackground = lazy(() =>
  import('@/components/AtmosphericBackground')
    .then(m => ({ default: m.AtmosphericBackground }))
    .catch(() => ({ default: () => null }))
);
const DimensionalRift = lazy(() =>
  import('@/components/DimensionalRift')
    .then(m => ({ default: m.DimensionalRift }))
    .catch(() => ({ default: () => null }))
);

// Lazy load above-the-fold but non-critical components
const EventCountdown = lazy(() =>
  import('@/components/EventCountdown')
    .then(m => ({ default: m.EventCountdown }))
    .catch(() => ({ default: () => null }))
);

// Lazy load below-the-fold components
const AboutSection = lazy(() =>
  import('@/components/AboutSection')
    .then(m => ({ default: m.AboutSection }))
    .catch(() => ({ default: () => null }))
);
const RegistrationCTA = lazy(() =>
  import('@/components/RegistrationCTA')
    .then(m => ({ default: m.RegistrationCTA }))
    .catch(() => ({ default: () => null }))
);
const ContactForm = lazy(() =>
  import('@/components/ContactForm')
    .then(m => ({ default: m.ContactForm }))
    .catch(() => ({ default: () => null }))
);
const FAQSection = lazy(() =>
  import('@/components/FAQSection')
    .then(m => ({ default: m.FAQSection }))
    .catch(() => ({ default: () => null }))
);
const ContactFooter = lazy(() =>
  import('@/components/ContactFooter')
    .then(m => ({ default: m.ContactFooter }))
    .catch(() => ({ default: () => null }))
);

// Lazy load heavy modal components - only when needed
const RegistrationPage = lazy(() =>
  import('@/components/RegistrationPage')
    .then(m => ({ default: m.RegistrationPage }))
    .catch(() => ({ default: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-red-500">Failed to load Registration. Please refresh.</div> }))
);
const ExploreEventsPage = lazy(() =>
  import('@/components/ExploreEventsPage')
    .then(m => ({ default: m.ExploreEventsPage }))
    .catch(() => ({ default: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-red-500">Failed to load Events. Please refresh.</div> }))
);
const RegistrationStatusChecker = lazy(() =>
  import('@/components/RegistrationStatusChecker')
    .then(m => ({ default: m.RegistrationStatusChecker }))
    .catch(() => ({ default: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-red-500">Failed to load Status Checker. Please refresh.</div> }))
);
const ScheduleModal = lazy(() =>
  import('@/components/ScheduleModal')
    .then(m => ({ default: m.ScheduleModal }))
    .catch(() => ({ default: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-red-500">Failed to load Schedule. Please refresh.</div> }))
);
const EventDetailsModal = lazy(() =>
  import('@/components/EventDetailsModal')
    .then(m => ({ default: m.EventDetailsModal }))
    .catch(() => ({ default: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-red-500">Failed to load Event Details. Please refresh.</div> }))
);

// Minimal skeleton loaders
const SectionSkeleton = memo(({ height = 'h-96' }: { height?: string }) => (
  <div className={`w-full ${height} bg-gradient-to-b from-transparent to-red-950/5`} />
));
SectionSkeleton.displayName = 'SectionSkeleton';

// Modal loader
const ModalLoader = memo(() => (
  <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
    <div className="w-10 h-10 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
  </div>
));
ModalLoader.displayName = 'ModalLoader';

const Index = () => {
  // Check localStorage to skip intro if already seen
  const hasSeenIntro = typeof window !== 'undefined' && localStorage.getItem('kaizenIntroSeen') === 'true';

  const [showIntro, setShowIntro] = useState(!hasSeenIntro);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMainContent, setShowMainContent] = useState(hasSeenIntro);
  const [triggerHeroAnimation, setTriggerHeroAnimation] = useState(hasSeenIntro);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showExploreEvents, setShowExploreEvents] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [showStatusChecker, setShowStatusChecker] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // Preload heavy components while intro is playing
  useEffect(() => {
    // Start loading background immediately
    setBackgroundLoaded(true);

    // Preload other chunks
    const preloadChunks = async () => {
      try {
        await Promise.all([
          import('@/components/AtmosphericBackground'),
          import('@/components/DimensionalRift'),
          import('@/components/EventCountdown'),
        ]);
      } catch (e) {
        console.error("Preload failed", e);
      }
    };

    // Start preloading after a short delay to let the intro start smoothly
    const timer = setTimeout(() => {
      preloadChunks();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
  // Control body overflow when modals are open
  useEffect(() => {
    if (showIntro || showRegistration || showExploreEvents || showStatusChecker || showSchedule || showEventDetails) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showIntro, showRegistration, showExploreEvents, showStatusChecker, showSchedule, showEventDetails]);

  // Memoized handlers
  const handleShowRegistration = useCallback(() => setShowRegistration(true), []);
  const handleCloseRegistration = useCallback(() => setShowRegistration(false), []);
  const handleShowExploreEvents = useCallback(() => setShowExploreEvents(true), []);
  const handleCloseExploreEvents = useCallback(() => setShowExploreEvents(false), []);
  
  const handleShowEventDetails = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setShowEventDetails(true);
  }, []);
  const handleCloseEventDetails = useCallback(() => {
    setShowEventDetails(false);
    setSelectedEventId(undefined);
  }, []);

  const handleShowStatusChecker = useCallback(() => setShowStatusChecker(true), []);
  const handleCloseStatusChecker = useCallback(() => setShowStatusChecker(false), []);
  const handleShowSchedule = useCallback(() => setShowSchedule(true), []);
  const handleCloseSchedule = useCallback(() => setShowSchedule(false), []);

  const handleExploreToRegister = useCallback((eventId?: string) => {
    if (eventId) {
      setSelectedEventId(eventId);
    }
    setShowExploreEvents(false);
    setShowEventDetails(false);
    setShowRegistration(true);
  }, []);

  return (
    <>
      {/* Intro with professional transition */}
      {showIntro && (
        <StrangerThingsIntro onComplete={() => {
          // Mark intro as seen
          localStorage.setItem('kaizenIntroSeen', 'true');

          // Start transition sequence
          setIsTransitioning(true);

          // Step 1: Show main content (but still transparent from CSS)
          setShowMainContent(true);

          // Step 2: Hide intro after content starts appearing
          setTimeout(() => {
            setShowIntro(false);
          }, 800);

          // Step 3: Trigger hero animations after intro is fully gone
          setTimeout(() => {
            setTriggerHeroAnimation(true);
            setIsTransitioning(false);
          }, 1000);
        }} />
      )}

      {/* Main content with fade-in transition */}
      <div
        className="relative w-full min-h-screen bg-black transition-all duration-1000 ease-out"
        style={{
          backgroundColor: '#000',
          opacity: showMainContent ? 1 : 0,
          visibility: showMainContent ? 'visible' : 'hidden',
          transform: showMainContent ? 'scale(1)' : 'scale(0.92)',
          filter: showMainContent ? 'blur(0px)' : 'blur(10px)'
        }}
      >
        <SEOHead
          title="Kaizen 2025 - Technical & Cultural Fest | Register Now"
          description="Join Kaizen 2025, the premier technical and cultural festival. Register for exciting events, competitions, workshops, and win amazing prizes. Don't miss out!"
          keywords="kaizen 2025, technical fest, cultural fest, college events, student competitions, tech workshops, innovation, prizes"
        />

        {/* Background effects - deferred loading */}
        {backgroundLoaded && showMainContent && (
          <Suspense fallback={null}>
            <AtmosphericBackground />
            <DimensionalRift />
          </Suspense>
        )}

        <div className="relative z-10">
          {/* Critical above-the-fold content - no lazy loading */}
          <Navbar onRegisterClick={handleShowRegistration} onCheckStatusClick={handleShowStatusChecker} />
          <HeroSection
            onExploreEvents={handleShowExploreEvents}
            animateIn={triggerHeroAnimation}
          />

          {/* Above-the-fold but non-critical */}
          <Suspense fallback={<SectionSkeleton height="h-32" />}>
            <EventCountdown />
          </Suspense>

          {/* Below-the-fold sections */}
          <div>
            <Suspense fallback={<SectionSkeleton />}>
              <AboutSection onDiscoverMore={handleShowExploreEvents} />
            </Suspense>
          </div>

          <div>
            <Suspense fallback={<SectionSkeleton height="h-64" />}>
              <RegistrationCTA onOpen={handleShowRegistration} onViewSchedule={handleShowSchedule} />
            </Suspense>
          </div>

          <div>
            <Suspense fallback={<SectionSkeleton />}>
              <FAQSection />
            </Suspense>
          </div>

          <div>
            <Suspense fallback={<SectionSkeleton />}>
              <ContactForm />
            </Suspense>
          </div>

          <div>
            <Suspense fallback={<SectionSkeleton height="h-64" />}>
              <ContactFooter />
            </Suspense>
          </div>
        </div>

        {/* Modal components - only render when active */}
        {showRegistration && (
          <Suspense fallback={<ModalLoader />}>
            <ErrorBoundary>
              <RegistrationPage 
                onClose={handleCloseRegistration} 
                initialEventId={selectedEventId}
              />
            </ErrorBoundary>
          </Suspense>
        )}

        {showExploreEvents && (
          <Suspense fallback={<ModalLoader />}>
            <ErrorBoundary>
              <ExploreEventsPage
                onClose={handleCloseExploreEvents}
                onRegister={handleExploreToRegister}
              />
            </ErrorBoundary>
          </Suspense>
        )}

        {showEventDetails && selectedEventId && (
          <Suspense fallback={<ModalLoader />}>
            <ErrorBoundary>
              <EventDetailsModal
                eventId={selectedEventId}
                onClose={handleCloseEventDetails}
                onRegister={handleExploreToRegister}
              />
            </ErrorBoundary>
          </Suspense>
        )}

        {showStatusChecker && (
          <Suspense fallback={<ModalLoader />}>
            <ErrorBoundary>
              <RegistrationStatusChecker onClose={handleCloseStatusChecker} />
            </ErrorBoundary>
          </Suspense>
        )}

        {showSchedule && (
          <Suspense fallback={<ModalLoader />}>
            <ErrorBoundary>
              <ScheduleModal onClose={handleCloseSchedule} />
            </ErrorBoundary>
          </Suspense>
        )}
      </div>
    </>
  );
};

export default Index;
