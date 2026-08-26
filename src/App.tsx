import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Course, SliderImage } from './types';
import { apiFetch, getStoredToken, removeStoredToken, setStoredToken } from './lib/api';
import { auth, onAuthStateChanged, signOut } from './lib/firebase';
import {
  fsSubscribeCourses,
  fsSubscribeSliderImages,
  fsGetCourses,
  fsGetSliderImages,
  fsCleanupObsoleteCollections,
  fsEnsureAdminUserInFirestore,
  fsCleanOldAdminFromFirestore,
} from './lib/firestoreService';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { EnrolmentModal } from './components/EnrolmentModal';
import { FloatingContactWidget } from './components/FloatingContactWidget';

import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { ContactPage } from './pages/ContactPage';
import { ResultsPage } from './pages/ResultsPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { CourseLearningPage } from './pages/CourseLearningPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { SEO } from './components/SEO';
import { getSEOForPath } from './utils/seoConfig';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname) {
      return window.location.pathname;
    }
    return '/';
  });
  const [user, setUser] = useState<User | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedEnrollCourse, setSelectedEnrollCourse] = useState<Course | null>(null);
  const [selectedDetailCourse, setSelectedDetailCourse] = useState<Course | null>(null);
  const [selectedLearningCourse, setSelectedLearningCourse] = useState<Course | null>(null);
  const [selectedLearningTopicIndex, setSelectedLearningTopicIndex] = useState<number | undefined>(undefined);
  const [selectedLearningTimestamp, setSelectedLearningTimestamp] = useState<number | undefined>(undefined);

  const [quickResultRollNumber, setQuickResultRollNumber] = useState('');

  // Auth flow states
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Synchronize browser history and handle mobile/browser back & forward button events
  useEffect(() => {
    // Disable automatic browser scroll restoration so every page transition starts cleanly from the top
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const initialPath = window.location.pathname || '/';
    if (!window.history.state || !window.history.state.path) {
      window.history.replaceState({ path: initialPath }, '', initialPath);
    }

    const handlePopState = (event: PopStateEvent) => {
      // If enrollment modal is open, back button simply closes it (1 step back)
      if (showEnrollModal) {
        setShowEnrollModal(false);
      }

      // Read target path from history state or window location
      const targetPath = event.state?.path || window.location.pathname || '/';
      setCurrentPath(targetPath);

      // Restore selected detail course if courseId is in history state
      if (event.state?.courseId && courses.length > 0) {
        const found = courses.find((c) => c.id === event.state.courseId);
        if (found) {
          setSelectedDetailCourse(found);
          setSelectedLearningCourse(found);
        }
      }

      if (event.state?.topicIndex !== undefined) {
        setSelectedLearningTopicIndex(event.state.topicIndex);
      }

      if (event.state?.timestamp !== undefined) {
        setSelectedLearningTimestamp(event.state.timestamp);
      }

      // Always start strictly from top on mobile/browser back/forward button
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showEnrollModal, courses]);

  // Guaranteed instant scroll to top on ANY route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentPath]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const syncRes = await apiFetch<{ token: string; user: User }>('/api/auth/firebase-sync', {
            method: 'POST',
            body: JSON.stringify({
              uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || '',
              phone: fbUser.phoneNumber || '',
            }),
          });

          if (syncRes.token && syncRes.user) {
            setStoredToken(syncRes.token);
            setUser(syncRes.user);
          }
        } catch (err) {
          console.warn('Error syncing Firebase auth session with backend:', err);
        }
      } else {
        // Fallback to token if present
        const token = getStoredToken();
        if (token) {
          apiFetch<{ user: User }>('/api/auth/me')
            .then((res) => {
              if (res.user) setUser(res.user);
            })
            .catch(() => {
              removeStoredToken();
              setUser(null);
            });
        } else {
          setUser(null);
        }
      }
    });

    // 1. Subscribe to Real-Time Courses from Firestore
    const unsubCourses = fsSubscribeCourses((liveCourses) => {
      setCourses(liveCourses || []);
      setIsInitialLoading(false);
    });

    // 2. Subscribe to Real-Time Hero Sliders from Firestore
    const unsubSliders = fsSubscribeSliderImages((liveSliders) => {
      if (liveSliders && liveSliders.length > 0) {
        setSliderImages(liveSliders);
      }
    });

    // Direct Firestore fetch
    const fetchInitialData = async () => {
      try {
        const [firestoreCourses, firestoreSliders] = await Promise.all([
          fsGetCourses(),
          fsGetSliderImages(),
        ]);
        setCourses(firestoreCourses || []);
        if (firestoreSliders && firestoreSliders.length > 0) {
          setSliderImages(firestoreSliders);
        }
        // Ensure Firestore /users collection contains rajoritech@gmail.com admin and clean old admins
        fsEnsureAdminUserInFirestore().catch(() => {});
        fsCleanOldAdminFromFirestore().catch(() => {});
        // Purge obsolete Firestore collections (like brandingSettings, test) in the background
        fsCleanupObsoleteCollections().catch(() => {});
      } catch (err) {
        console.error('Error loading initial app data from Firestore:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      unsubscribe();
      unsubCourses();
      unsubSliders();
    };
  }, []);

  const handleNavigate = (path: string, replace = false) => {
    if (path !== currentPath) {
      if (replace) {
        window.history.replaceState({ path }, '', path);
      } else {
        window.history.pushState({ path }, '', path);
      }
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    // 1. Immediately purge client token & user state synchronously to prevent onAuthStateChanged race condition
    removeStoredToken();
    setUser(null);
    setLoginSuccessMsg('');
    handleNavigate('/', true);

    // 2. Clear Firebase & backend sessions in background
    try {
      await signOut(auth);
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
  };

  const handleOpenEnroll = (course?: Course) => {
    setSelectedEnrollCourse(course || null);
    setShowEnrollModal(true);
    // Push modal state to history stack so mobile back button closes modal first
    window.history.pushState({ path: currentPath, modal: 'enroll' }, '', window.location.pathname);
  };

  const handleCloseEnroll = () => {
    setShowEnrollModal(false);
    if (window.history.state?.modal === 'enroll') {
      window.history.back();
    }
  };

  const handleSelectCourseDetail = (course: Course) => {
    setSelectedDetailCourse(course);
    if (currentPath !== '/course-detail') {
      window.history.pushState({ path: '/course-detail', courseId: course.id }, '', '/course-detail');
      setCurrentPath('/course-detail');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickResultLookup = (rollNo: string) => {
    setQuickResultRollNumber(rollNo);
    handleNavigate('/results');
  };

  const popularCourses = courses.length > 0
    ? (courses.some((c) => c.popular) ? courses.filter((c) => c.popular) : courses)
    : [];

  const defaultSEO = getSEOForPath(currentPath);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Dynamic SEO Meta Tags via React Helmet Async */}
      <SEO
        title={defaultSEO.title}
        description={defaultSEO.description}
        keywords={defaultSEO.keywords}
        ogType={defaultSEO.ogType}
        noIndex={defaultSEO.noIndex}
        path={currentPath}
      />

      {/* Sticky Header Navbar */}
      <Navbar
        currentPath={currentPath}
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenEnroll={() => handleOpenEnroll()}
      />

      {/* Main Page View Router */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full"
          >
            {currentPath === '/' && (
              <HomePage
                sliderImages={sliderImages}
                popularCourses={popularCourses.length > 0 ? popularCourses : courses.slice(0, 3)}
                isLoading={isInitialLoading}
                onNavigate={handleNavigate}
                onOpenEnroll={handleOpenEnroll}
                onSelectCourse={handleSelectCourseDetail}
              />
            )}

            {currentPath === '/about' && <AboutPage />}

            {currentPath === '/courses' && (
              <CoursesPage
                courses={courses}
                isLoading={isInitialLoading}
                onOpenEnroll={handleOpenEnroll}
                onSelectCourse={handleSelectCourseDetail}
              />
            )}

            {currentPath === '/course-detail' && (
              <CourseDetailPage
                course={selectedDetailCourse || courses[0]}
                onNavigate={handleNavigate}
                onBack={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    handleNavigate('/courses');
                  }
                }}
                onOpenEnroll={handleOpenEnroll}
              />
            )}

            {currentPath === '/contact' && <ContactPage courses={courses} />}

            {currentPath === '/results' && (
              <ResultsPage initialRollNumber={quickResultRollNumber} />
            )}

            {currentPath === '/student/dashboard' && (
              <StudentDashboard
                onBack={() => handleNavigate('/')}
                onNavigate={handleNavigate}
                onSeeCourse={(course, topicIndex, timestamp) => {
                  setSelectedLearningCourse(course);
                  setSelectedLearningTopicIndex(topicIndex);
                  setSelectedLearningTimestamp(timestamp);
                  handleNavigate('/student/course-learn');
                }}
              />
            )}

            {(currentPath === '/student/course-learn' || currentPath === '/course-learn') && (
              <CourseLearningPage
                courseId={selectedLearningCourse?.id || (courses.length > 0 ? courses[0].id : undefined)}
                initialCourse={selectedLearningCourse || (courses.length > 0 ? courses[0] : null)}
                initialTopicIndex={selectedLearningTopicIndex}
                initialTimestamp={selectedLearningTimestamp}
                user={user}
                onBack={() => handleNavigate('/student/dashboard')}
                onNavigateToCourseDetail={(crs) => {
                  setSelectedDetailCourse(crs);
                  handleNavigate('/course-detail');
                }}
              />
            )}

            {currentPath === '/admin/dashboard' && <AdminDashboard />}

            {(currentPath === '/login' || currentPath === '/register' || currentPath === '/verify-otp') && (
              <LoginPage
                onLoginSuccess={(loggedInUser) => {
                  setUser(loggedInUser);
                  setLoginSuccessMsg('');
                  if (loggedInUser.role === 'admin') {
                    handleNavigate('/admin/dashboard');
                  } else {
                    handleNavigate('/student/dashboard');
                  }
                }}
                onNavigate={handleNavigate}
                successMessage={loginSuccessMsg}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} onOpenEnroll={() => handleOpenEnroll()} />

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <EnrolmentModal
          course={selectedEnrollCourse}
          courses={courses}
          onClose={handleCloseEnroll}
        />
      )}

      {/* Floating Quick Contact Widget (Phone Call & WhatsApp) */}
      <FloatingContactWidget />
    </div>
  );
}
