import React, { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, ThumbsUp, Send, Sparkles, AlertCircle, Quote, ChevronLeft, ChevronRight, Lock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, CourseReview, User } from '../types';
import { apiFetch, getStoredToken, getStoredUser } from '../lib/api';
import { fsSubscribeCourseReviews } from '../lib/firestoreService';
import { ReviewAvatar } from './ReviewAvatar';

interface CourseReviewsProps {
  course: Course;
  onNavigate?: (path: string) => void;
}

export const CourseReviews: React.FC<CourseReviewsProps> = ({ course, onNavigate }) => {
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [isEnrolledInThisCourse, setIsEnrolledInThisCourse] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);

  // Touch / Drag swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Form states
  const [rating, setRating] = useState(5);
  const [batch, setBatch] = useState('2026 Batch');
  const [reviewText, setReviewText] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Subscribe to live course reviews and current user profile
  useEffect(() => {
    setShowReviewForm(false);
    checkCurrentUserEnrollment();

    const unsub = fsSubscribeCourseReviews((liveReviews) => {
      const courseMatched = liveReviews.filter(
        (r) => r.courseId === course.id && Boolean(r.reviewText && r.studentName)
      );
      setReviews(courseMatched);
    });

    return () => unsub();
  }, [course.id]);

  const checkCurrentUserEnrollment = async () => {
    setCheckingEnrollment(true);
    const token = getStoredToken();
    if (!token) {
      setCurrentUser(null);
      setIsEnrolledInThisCourse(false);
      setCheckingEnrollment(false);
      return;
    }

    try {
      // Check direct auth user first
      const authRes = await apiFetch<any>('/api/auth/me');
      const authUser = authRes?.user || getStoredUser();

      if (authUser?.role === 'admin') {
        setCurrentUser(authUser);
        setIsEnrolledInThisCourse(false);
        setCheckingEnrollment(false);
        return;
      }

      const overview = await apiFetch<any>('/api/student/me/overview');
      if (overview.student) {
        setCurrentUser({ ...overview.student, role: 'student' });
        const selectedIds: string[] = [];
        if (overview.student.courseId) selectedIds.push(overview.student.courseId);
        if (overview.student.selectedCourseIds) {
          overview.student.selectedCourseIds.forEach((id: string) => {
            if (!selectedIds.includes(id)) selectedIds.push(id);
          });
        }
        if (overview.enrolledCourses) {
          overview.enrolledCourses.forEach((c: Course) => {
            if (!selectedIds.includes(c.id)) selectedIds.push(c.id);
          });
        }
        setEnrolledCourseIds(selectedIds);
        setIsEnrolledInThisCourse(selectedIds.includes(course.id));
      } else if (authUser) {
        setCurrentUser(authUser);
        const userIds = authUser.selectedCourseIds || [];
        setEnrolledCourseIds(userIds);
        setIsEnrolledInThisCourse(userIds.includes(course.id));
      }
    } catch {
      const stored = getStoredUser();
      setCurrentUser(stored);
      setIsEnrolledInThisCourse(false);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  // Auto-slide every 10 seconds automatically
  useEffect(() => {
    if (reviews.length <= 1) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [reviews.length]);

  const handleNext = () => {
    if (reviews.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    if (reviews.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
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

  const handleHelpful = async (id: string) => {
    if (helpfulVotes[id]) return;
    setReviews((prev) =>
      prev.map((item) => (item.id === id ? { ...item, helpfulCount: (item.helpfulCount || 0) + 1 } : item))
    );
    setHelpfulVotes((prev) => ({ ...prev, [id]: true }));
    try {
      await apiFetch(`/api/courses/reviews/${id}/helpful`, { method: 'POST' });
    } catch {
      // Silent error
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!currentUser) {
      setFormError('Please log in with your student account to submit a review.');
      return;
    }

    if (!isEnrolledInThisCourse && currentUser.role !== 'admin') {
      setFormError('You can only submit reviews for courses you are currently enrolled in.');
      return;
    }

    if (!reviewText.trim()) {
      setFormError('Please enter your review feedback.');
      return;
    }
    if (reviewText.trim().length < 5) {
      setFormError('Review message should be at least 5 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<any>(`/api/courses/${course.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          batch,
          avatar: currentUser?.avatar || undefined,
          reviewText: reviewText.trim(),
        }),
      });

      if (res.review) {
        setReviews((prev) => [res.review, ...prev.filter((r) => r.id !== res.review.id)]);
      }

      setCurrentIndex(0);
      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        setShowReviewForm(false);
        setReviewText('');
        setRating(5);
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Student Feedback</span>
          </div>
          <h2 className="text-2xl font-black text-indigo-950">Course Student Reviews</h2>
          <p className="text-xs text-slate-500 font-medium">Real experiences and feedback from verified course graduates.</p>
        </div>

        {/* Show Action button: 'Write a Review' for enrolled students, 'Administrator Mode' notice for admins, or 'Sign in to Review' for guests */}
        {!currentUser ? (
          <button
            type="button"
            onClick={() => (onNavigate ? onNavigate('/login') : (window.location.href = '/login'))}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl transition-all border border-slate-300 shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>Sign In to Review</span>
          </button>
        ) : currentUser?.role === 'admin' ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <span>Admin Mode (Student Reviews Only)</span>
          </div>
        ) : isEnrolledInThisCourse ? (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{showReviewForm ? 'Close Form' : 'Write a Review'}</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Enrolled Students Only</span>
          </div>
        )}
      </div>

      {/* Review Form Drawer/Modal - only accessible if enrolled student */}
      {showReviewForm && isEnrolledInThisCourse && currentUser?.role === 'student' && (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-indigo-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Leave Your Feedback for {course.title}</span>
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enrolled Student Verified</span>
            </span>
          </div>

          {submitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Thank you! Your course review has been submitted and is now live on this course page.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4" noValidate>
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Student Profile Preview Strip */}
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
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
                    {currentUser.rollNumber ? `Roll No: ${currentUser.rollNumber}` : 'Verified Student Profile'}
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
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">Batch / Year</label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="e.g. 2026 Batch"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">Star Rating *</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-extrabold text-indigo-950 ml-2">{rating}.0 / 5.0</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">Your Review / Feedback *</label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={`Share what you liked about ${course.title}, practical lab guidance, or instructor support...`}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-extrabold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Horizontal Wipe Slides Carousel Container */}
      <div
        className="relative bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-lg overflow-hidden select-none"
        onTouchStart={reviews.length > 1 ? handleTouchStart : undefined}
        onTouchMove={reviews.length > 1 ? handleTouchMove : undefined}
        onTouchEnd={reviews.length > 1 ? handleTouchEnd : undefined}
        onMouseDown={reviews.length > 1 ? handleTouchStart : undefined}
        onMouseMove={reviews.length > 1 ? handleTouchMove : undefined}
        onMouseUp={reviews.length > 1 ? handleTouchEnd : undefined}
      >
        {/* Background Decorative Quote */}
        <Quote className="absolute top-4 right-6 w-32 h-32 text-indigo-50/80 pointer-events-none" />

        {/* Horizontal Wipe Viewport */}
        {reviews.length > 0 ? (
          <div className="relative overflow-hidden z-10 min-h-[200px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {reviews[currentIndex] && (
                <motion.div
                  key={reviews[currentIndex].id || currentIndex}
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
                      {[...Array(reviews[currentIndex].rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                      <span className="text-xs font-black text-amber-900 ml-1">
                        {reviews[currentIndex].rating}.0 / 5.0
                      </span>
                    </div>

                    {reviews[currentIndex].verified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Student ({reviews[currentIndex].batch})</span>
                      </span>
                    )}
                  </div>

                  {/* Review Text */}
                  <blockquote className="text-base sm:text-xl font-medium text-slate-800 leading-relaxed italic border-l-4 border-indigo-600 pl-4 sm:pl-6 my-3">
                    "{reviews[currentIndex].reviewText}"
                  </blockquote>

                  {/* Student Info & Helpful Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <ReviewAvatar
                        avatarUrl={reviews[currentIndex].avatar}
                        name={reviews[currentIndex].studentName}
                        size="md"
                      />
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-indigo-950">
                          {reviews[currentIndex].studentName}
                        </h3>
                        <p className="text-xs sm:text-sm font-extrabold text-indigo-600">
                          {reviews[currentIndex].courseTitle || course.title}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {reviews[currentIndex].batch} • {reviews[currentIndex].createdAt || 'Recent Review'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleHelpful(reviews[currentIndex].id)}
                      disabled={helpfulVotes[reviews[currentIndex].id]}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        helpfulVotes[reviews[currentIndex].id]
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Helpful ({reviews[currentIndex].helpfulCount || 0})</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-10 px-4 text-center space-y-3 max-w-md mx-auto relative z-10">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-indigo-950">No Course Reviews Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Be the first enrolled student to share your practical feedback for {course.title}.
              </p>
            </div>
            <div className="pt-1">
              {!currentUser ? (
                <button
                  type="button"
                  onClick={() => (onNavigate ? onNavigate('/login') : (window.location.href = '/login'))}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In as Student to Review</span>
                </button>
              ) : isEnrolledInThisCourse || currentUser.role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => setShowReviewForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>Write First Review</span>
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Bottom Slide Dot Indicators & Navigation Arrows */}
        {reviews.length > 1 && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 relative z-10">
            {/* Slide Indicator Dots */}
            <div className="flex items-center gap-2">
              {reviews.map((_, idx) => (
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
                aria-label="Previous review"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-500 px-1">
                {currentIndex + 1} / {reviews.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
                aria-label="Next review"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
