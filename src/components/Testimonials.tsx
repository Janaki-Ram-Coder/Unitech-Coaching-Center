import React, { useState, useEffect } from 'react';
import {
  Star,
  Quote,
  CheckCircle2,
  Sparkles,
  MessageSquarePlus,
  X,
  Send,
  Lock,
  ShieldAlert,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, InstituteReview, User } from '../types';
import { apiFetch, getStoredToken, getStoredUser } from '../lib/api';
import { fsSubscribeInstituteReviews } from '../lib/firestoreService';
import { ReviewAvatar } from './ReviewAvatar';

interface TestimonialsProps {
  onOpenEnroll?: () => void;
  onNavigate?: (path: string) => void;
}

export const Testimonials: React.FC<TestimonialsProps> = ({ onOpenEnroll, onNavigate }) => {
  const [testimonials, setTestimonials] = useState<InstituteReview[]>([]);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [totalReviewsCount, setTotalReviewsCount] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // Current logged in user and their enrolled courses
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [enrolledCoursesList, setEnrolledCoursesList] = useState<Course[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Form state for adding review
  const [selectedCourseTitle, setSelectedCourseTitle] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newReview, setNewReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // Subscribe to real-time institute reviews from Firestore on mount
  useEffect(() => {
    const unsub = fsSubscribeInstituteReviews((liveReviews) => {
      const validReviews = liveReviews.filter((r) => Boolean(r.reviewText && r.studentName));
      setTestimonials(validReviews);
      setTotalReviewsCount(validReviews.length);
      if (validReviews.length > 0) {
        const avg = Number((validReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / validReviews.length).toFixed(1));
        setAverageRating(avg);
      } else {
        setAverageRating(5.0);
      }
    });

    return () => unsub();
  }, []);

  // Fetch student profile when modal opens or on token change
  useEffect(() => {
    if (showAddModal) {
      fetchStudentInfo();
    }
  }, [showAddModal]);

  const fetchStudentInfo = async () => {
    setLoadingUser(true);
    setFormError('');
    const token = getStoredToken();
    if (!token) {
      setCurrentUser(null);
      setEnrolledCoursesList([]);
      setLoadingUser(false);
      return;
    }

    try {
      // 1. Check direct auth user first to verify role correctly
      const authRes = await apiFetch<any>('/api/auth/me');
      const authUser = authRes?.user || getStoredUser();

      if (authUser?.role === 'admin') {
        setCurrentUser(authUser);
        setEnrolledCoursesList([]);
        setLoadingUser(false);
        return;
      }

      const overview = await apiFetch<any>('/api/student/me/overview');
      if (overview.student) {
        setCurrentUser({ ...overview.student, role: 'student' });
        const courses: Course[] = overview.enrolledCourses || [];
        setEnrolledCoursesList(courses);
        if (courses.length > 0) {
          setSelectedCourseTitle(courses[0].title);
        } else if (overview.student.courseTitle) {
          setSelectedCourseTitle(overview.student.courseTitle);
        }
      } else if (authUser) {
        setCurrentUser(authUser);
      } else {
        setCurrentUser(null);
      }
    } catch {
      const stored = getStoredUser();
      setCurrentUser(stored);
    } finally {
      setLoadingUser(false);
    }
  };

  // Auto-slide every 10 seconds automatically
  useEffect(() => {
    if (testimonials.length <= 1) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  // Lock background scroll when modal opens
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal]);

  const handleNext = () => {
    if (testimonials.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    if (testimonials.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleSelectIndex = (idx: number) => {
    if (idx === currentIndex) return;
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  // Touch / Drag swipe handlers
  const minSwipeDistance = 40;

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setTouchStart(clientX);
    setTouchEnd(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStart === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setTouchEnd(clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!currentUser) {
      setFormError('Please log in with your student account to rate the institute.');
      return;
    }

    if (!newReview.trim()) {
      setFormError('Please enter your review feedback.');
      return;
    }

    if (newReview.trim().length < 5) {
      setFormError('Review must be at least 5 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<any>('/api/institute/reviews', {
        method: 'POST',
        body: JSON.stringify({
          rating: newRating,
          roleOrCompany: newRole.trim() || 'Oritech Student',
          courseTitle: selectedCourseTitle || (enrolledCoursesList[0]?.title) || currentUser.courseTitle || 'Computer Course',
          avatar: currentUser.avatar || undefined,
          reviewText: newReview.trim(),
          batchYear: '2026',
        }),
      });

      if (res.review) {
        setTestimonials((prev) => [res.review, ...prev.filter((r) => r.id !== res.review.id)]);
        if (res.averageRating) setAverageRating(res.averageRating);
        if (res.totalReviews !== undefined) setTotalReviewsCount(res.totalReviews);
        else setTotalReviewsCount((prev) => prev + 1);
      }

      setCurrentIndex(0);
      setSubmittedMessage(true);

      setTimeout(() => {
        setSubmittedMessage(false);
        setShowAddModal(false);
        setNewRole('');
        setNewReview('');
        setNewRating(5);
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      {/* Header Badge & Title */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Student Success Stories</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-indigo-950 tracking-tight">
          What Our Alumni & Students Say About Oritech Computer
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          Real feedback and experiences from verified students across our job-oriented software, accounting, and design courses.
        </p>
      </div>

      {/* Trust Metric Highlights Bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-indigo-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
            {averageRating}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm font-extrabold text-white">Overall Student & Coaching Rating</p>
            <p className="text-xs text-indigo-200">
              {testimonials.length > 0
                ? `Based on ${totalReviewsCount} verified student review${totalReviewsCount !== 1 ? 's' : ''}`
                : 'Verified student feedback • Rate our practical training'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-xs font-bold text-indigo-100">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-indigo-950 font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Rate Our Coaching & Share Review</span>
          </button>
        </div>
      </div>

      {/* Horizontal Wipe Slides Carousel Container */}
      <div
        className="relative bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-lg overflow-hidden select-none"
        onTouchStart={testimonials.length > 1 ? handleTouchStart : undefined}
        onTouchMove={testimonials.length > 1 ? handleTouchMove : undefined}
        onTouchEnd={testimonials.length > 1 ? handleTouchEnd : undefined}
        onMouseDown={testimonials.length > 1 ? handleTouchStart : undefined}
        onMouseMove={testimonials.length > 1 ? handleTouchMove : undefined}
        onMouseUp={testimonials.length > 1 ? handleTouchEnd : undefined}
      >
        {/* Background Decorative Quote */}
        <Quote className="absolute top-4 right-6 w-32 h-32 text-indigo-50/80 pointer-events-none" />

        {/* Horizontal Wipe Viewport */}
        {testimonials.length > 0 ? (
          <div className="relative overflow-hidden z-10 min-h-[200px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {testimonials[currentIndex] && (
                <motion.div
                  key={testimonials[currentIndex].id || currentIndex}
                  custom={direction}
                  initial={(dir: number) => ({
                    x: dir > 0 ? '100%' : '-100%',
                    opacity: 0,
                  })}
                  animate={{
                    x: '0%',
                    opacity: 1,
                    transition: {
                      x: { type: 'spring', stiffness: 280, damping: 28 },
                      opacity: { duration: 0.25 },
                    },
                  }}
                  exit={(dir: number) => ({
                    x: dir < 0 ? '100%' : '-100%',
                    opacity: 0,
                    transition: {
                      x: { type: 'spring', stiffness: 280, damping: 28 },
                      opacity: { duration: 0.2 },
                    },
                  })}
                  className="w-full space-y-5 px-1"
                >
                  {/* Rating & Verified Badge */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-amber-400 bg-amber-50/80 px-3 py-1 rounded-full border border-amber-200/60">
                      {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                      <span className="text-xs font-black text-amber-900 ml-1">
                        {testimonials[currentIndex].rating}.0 / 5.0
                      </span>
                    </div>

                    {testimonials[currentIndex].verified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Student ({testimonials[currentIndex].batchYear || '2026'})</span>
                      </span>
                    )}
                  </div>

                  {/* Review Text */}
                  <blockquote className="text-base sm:text-xl font-medium text-slate-800 leading-relaxed italic border-l-4 border-indigo-600 pl-4 sm:pl-6 my-3">
                    "{testimonials[currentIndex].reviewText}"
                  </blockquote>

                  {/* Student Info Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-4">
                    <ReviewAvatar
                      avatarUrl={testimonials[currentIndex].avatar}
                      name={testimonials[currentIndex].studentName}
                      size="md"
                    />
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-indigo-950">
                        {testimonials[currentIndex].studentName}
                      </h3>
                      <p className="text-xs sm:text-sm font-extrabold text-indigo-600">
                        {testimonials[currentIndex].courseTitle}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {testimonials[currentIndex].roleOrCompany || 'Oritech Student'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-12 px-4 text-center space-y-4 max-w-md mx-auto relative z-10">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-indigo-950">No Student Reviews Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Be the first verified enrolled student or alumni to share your learning feedback and rate our coaching.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Submit Student Review</span>
            </button>
          </div>
        )}

        {/* Bottom Slide Dot Indicators & Arrows */}
        {testimonials.length > 1 && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 relative z-10">
            {/* Slide Indicator Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx
                      ? 'w-8 bg-indigo-600 shadow-md shadow-indigo-600/30'
                      : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev / Next Arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-500 px-1">
                {currentIndex + 1} / {testimonials.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Review / Rate Coaching Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-3 sm:p-6 transition-all duration-300 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="min-h-full flex items-center justify-center p-0 sm:p-2 text-center">
            <div className="relative w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-2xl flex flex-col text-left overflow-hidden my-auto transform transition-all">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div>
                  <h3 className="text-lg font-black text-indigo-950">Rate Oritech Computer</h3>
                  <p className="text-xs text-slate-500">Your review and rating will be published live on the site.</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto overscroll-contain flex-1 space-y-4 focus:outline-none">
                {loadingUser ? (
                  <div className="space-y-4 py-2">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="w-32 h-3.5 rounded-md bg-slate-200 animate-pulse" />
                        <div className="w-24 h-3 rounded-md bg-slate-100 animate-pulse" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
                      <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
                    </div>
                    <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                  </div>
                ) : !currentUser ? (
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-center">
                    <Lock className="w-10 h-10 text-amber-600 mx-auto" />
                    <h4 className="text-sm font-bold text-amber-900">Student Login Required</h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Only enrolled Oritech Computer students can submit ratings and reviews for our coaching center. Please log in to your student account.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false);
                          if (onNavigate) {
                            onNavigate('/login');
                          }
                        }}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Sign In as Student</span>
                      </button>
                    </div>
                  </div>
                ) : currentUser.role === 'admin' ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">Administrator Account Active</h4>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                        You are currently signed in as an <strong>Administrator</strong> ({currentUser.email || currentUser.name || 'Admin'}). Student testimonials and ratings are strictly reserved for enrolled students.
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium text-left">
                      💡 <strong>Note:</strong> To write a review as a student, please sign in using a registered student Roll Number or student email account.
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false);
                          if (onNavigate) {
                            onNavigate('/login');
                          }
                        }}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Go to Student Login</span>
                      </button>
                    </div>
                  </div>
                ) : submittedMessage ? (
                  <div className="text-center py-8 space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h4 className="text-xl font-extrabold text-indigo-950">Review Published Successfully!</h4>
                    <p className="text-xs text-slate-600">Thank you for rating Oritech Computer. Your review is now live!</p>
                  </div>
                ) : (
                  <form onSubmit={handleAddReview} className="space-y-4">
                    {formError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Student Profile Preview Strip */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <ReviewAvatar
                        avatarUrl={currentUser.avatar}
                        name={currentUser.name || 'Student'}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-indigo-950 truncate">
                          {currentUser.name || 'Enrolled Student'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold truncate">
                          {currentUser.rollNumber ? `Roll No: ${currentUser.rollNumber}` : 'Verified Oritech Student'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-800 mb-1">Student Name</label>
                        <input
                          type="text"
                          disabled
                          value={currentUser.name || 'Enrolled Student'}
                          className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-800 mb-1">Enrolled Course *</label>
                        {enrolledCoursesList.length > 0 ? (
                          <select
                            value={selectedCourseTitle}
                            onChange={(e) => setSelectedCourseTitle(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                          >
                            {enrolledCoursesList.map((c) => (
                              <option key={c.id} value={c.title}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={selectedCourseTitle || currentUser.courseTitle || 'Computer Course'}
                            onChange={(e) => setSelectedCourseTitle(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1">Current Designation / Goal</label>
                      <input
                        type="text"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        placeholder="e.g. Student / Junior Accountant / Web Developer"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1">Coaching Center Rating *</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="p-1 focus:outline-none cursor-pointer hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-black text-indigo-950 ml-1">{newRating}.0 / 5.0</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1">Review & Experience Feedback *</label>
                      <textarea
                        required
                        rows={3}
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                        placeholder="Share your coaching feedback, lab facility experience, and teacher guidance..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 resize-none font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Publish Rating & Review Live</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
