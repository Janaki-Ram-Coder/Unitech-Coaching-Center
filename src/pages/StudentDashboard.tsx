import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  AlertCircle,
  X,
  ZoomIn,
  Play,
  FileText,
  BookOpen,
  GraduationCap,
  Clock,
  Sparkles,
  ChevronRight,
  Video,
  Download,
  RotateCcw,
  Award,
  Lock,
  Eye,
  Phone,
  Mail,
  Calendar,
  BadgeCheck,
} from 'lucide-react';
import { Student, Course, WatchProgress, CertificateRecord } from '../types';
import { apiFetch } from '../lib/api';
import { fsSubscribeStudents } from '../lib/firestoreService';
import { formatImageUrl, getProxyImageUrl } from '../lib/imageUtils';
import { formatSeconds, formatRelativeTime } from '../lib/timeUtils';
import { StudentDashboardSkeleton } from '../components/Skeleton';

interface StudentDashboardProps {
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onSeeCourse?: (course: Course, topicIndex?: number, timestamp?: number) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onBack,
  onNavigate,
  onSeeCourse,
}) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchProgress | null>(null);
  const [watchProgressMap, setWatchProgressMap] = useState<{ [courseId: string]: WatchProgress }>({});
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Image loading strategy: 0 = formatted direct/proxied URL, 1 = proxy fallback, 2 = failed
  const [imgFallbackStage, setImgFallbackStage] = useState<number>(0);
  const [isMainImgLoaded, setIsMainImgLoaded] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);

  useEffect(() => {
    fetchStudentProfile();

    // Live subscription to Firestore students collection
    const unsubscribe = fsSubscribeStudents((studentsList) => {
      if (!studentsList || studentsList.length === 0) return;
      const urlParams = new URLSearchParams(window.location.search);
      const qRoll = (urlParams.get('roll') || urlParams.get('rollNumber') || '').trim().toLowerCase();
      const qId = (urlParams.get('id') || urlParams.get('studentId') || '').trim();
      const qEmail = (urlParams.get('email') || '').trim().toLowerCase();

      setStudent((prev) => {
        const target = studentsList.find((s) => {
          const sRoll = (s.rollNumber || '').trim().toLowerCase();
          const sId = (s.id || '').trim();
          const sEmail = (s.email || '').trim().toLowerCase();

          if (qRoll && sRoll === qRoll) return true;
          if (qId && (sId === qId || s.id === qId)) return true;
          if (qEmail && sEmail === qEmail) return true;

          if (prev) {
            return (
              s.id === prev.id ||
              (prev.rollNumber && sRoll === prev.rollNumber.trim().toLowerCase()) ||
              (prev.email && sEmail === prev.email.trim().toLowerCase())
            );
          }
          return false;
        });

        if (target) {
          return target;
        } else if (!prev && studentsList.length > 0) {
          return studentsList[0];
        }
        return prev;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Preload and reset fallback stage whenever the student avatar changes
  useEffect(() => {
    setImgFallbackStage(0);
    setIsMainImgLoaded(false);
    if (student?.avatar) {
      const targetUrl = formatImageUrl(student.avatar);
      if (targetUrl) {
        const preloader = new Image();
        preloader.onload = () => setIsMainImgLoaded(true);
        preloader.src = targetUrl;
      }
    }
  }, [student?.avatar]);

  // Close full image modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFullImageModal(false);
      }
    };
    if (showFullImageModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFullImageModal]);

  const fetchStudentProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qRoll = urlParams.get('roll') || urlParams.get('rollNumber');
      const qId = urlParams.get('id') || urlParams.get('studentId');
      const qEmail = urlParams.get('email');

      let endpoint = '/api/student/me/overview';
      if (qRoll) endpoint += `?roll=${encodeURIComponent(qRoll)}`;
      else if (qId) endpoint += `?id=${encodeURIComponent(qId)}`;
      else if (qEmail) endpoint += `?email=${encodeURIComponent(qEmail)}`;

      const [res, coursesRes] = await Promise.all([
        apiFetch<any>(endpoint),
        apiFetch<Course[]>('/api/courses').catch(() => [] as Course[]),
      ]);

      if (coursesRes && coursesRes.length > 0) {
        setAllCourses(coursesRes);
      }

      if (res.student) {
        setStudent(res.student);
      }

      if (res.student?.status === 'Completed') {
        if (res.certificate) {
          setCertificate(res.certificate);
        } else if (res.student?.certificateUrl) {
          setCertificate({
            id: `cert-${res.student.id}`,
            rollNumber: res.student.rollNumber,
            studentName: res.student.name,
            courseTitle: res.student.courseTitle || 'Computer Course',
            certificateNumber: res.student.certificateNumber || `CERT-2026-${res.student.rollNumber.replace(/\D/g, '') || '101'}`,
            issueDate: res.student.certificateIssueDate || '2026-01-01',
            grade: res.student.certificateGrade || 'A+ (Distinction)',
            certificateUrl: res.student.certificateUrl,
            remarks: 'Official Institute Certification',
            verified: true,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setCertificate(null);
      }

      // Continue Watching & Watch Progress
      if (res.continueWatching) {
        setContinueWatching(res.continueWatching);
      } else if (res.student?.continueWatching) {
        setContinueWatching(res.student.continueWatching);
      } else if (res.user?.continueWatching) {
        setContinueWatching(res.user.continueWatching);
      }

      if (res.watchProgress && typeof res.watchProgress === 'object') {
        setWatchProgressMap(res.watchProgress);
      } else if (res.student?.watchProgress) {
        setWatchProgressMap(res.student.watchProgress);
      }

      if (res.enrolledCourses && res.enrolledCourses.length > 0) {
        setEnrolledCourses(res.enrolledCourses);
      } else if (res.student && coursesRes.length > 0) {
        // Find matching course by title or enrolledCourseIds
        const matched = coursesRes.filter((c) => {
          if (res.student.enrolledCourseIds && res.student.enrolledCourseIds.includes(c.id)) {
            return true;
          }
          if (res.student.courseTitle && (c.title || '').toLowerCase().includes((res.student.courseTitle || '').toLowerCase())) {
            return true;
          }
          return false;
        });
        if (matched.length > 0) {
          setEnrolledCourses(matched);
        } else {
          // Fallback to first course so student can always see curriculum
          setEnrolledCourses([coursesRes[0]]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load student profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const handleCourseClick = (course: Course, topicIndex?: number, timestamp?: number) => {
    if (onSeeCourse) {
      onSeeCourse(course, topicIndex, timestamp);
    } else if (onNavigate) {
      const topicParam = topicIndex !== undefined ? `&topic=${topicIndex}` : '';
      const timeParam = timestamp !== undefined ? `&t=${timestamp}` : '';
      onNavigate(`/student/course-learn?courseId=${course.id}${topicParam}${timeParam}`);
    } else {
      window.location.href = `/student/course-learn?courseId=${course.id}`;
    }
  };

  const handleResumeContinueWatching = () => {
    if (!continueWatching) return;
    const targetCourse =
      enrolledCourses.find((c) => c.id === continueWatching.courseId) ||
      allCourses.find((c) => c.id === continueWatching.courseId) || {
        id: continueWatching.courseId,
        title: continueWatching.courseTitle || 'Enrolled Course',
        code: 'COURSE',
        category: 'Study Portal',
        duration: 'Self-Paced',
        fee: 0,
        description: '',
        syllabus: [],
        popular: false,
        thumbnail: '',
        prerequisites: '',
        level: 'All Levels',
      };

    handleCourseClick(
      targetCourse as Course,
      continueWatching.topicIndex,
      continueWatching.timestampSeconds
    );
  };

  // Open Full Image Viewer with history push so mobile back button closes only modal
  const handleCircleClick = () => {
    setShowFullImageModal(true);
    window.history.pushState({ modal: 'image-viewer' }, '');
  };

  const handleCloseImageModal = () => {
    setShowFullImageModal(false);
    if (window.history.state?.modal === 'image-viewer') {
      window.history.back();
    }
  };

  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      if (showFullImageModal) {
        setShowFullImageModal(false);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
    };
  }, [showFullImageModal]);

  if (loading) {
    return <StudentDashboardSkeleton />;
  }

  if (error || !student) {
    return (
      <div className="pt-10 pb-16 flex items-center justify-center px-4">
        <div className="p-8 bg-white border-2 border-blue-900 text-red-700 rounded-3xl shadow-lg shadow-blue-950/10 space-y-4 max-w-sm w-full text-center relative">
          <button
            type="button"
            onClick={handleBack}
            className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Go Back"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mt-2" />
          <h3 className="text-base font-bold text-slate-900">Student Profile</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || 'Please log in to view your student profile.'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate image sources with resilient proxy fallbacks
  const rawAvatar = student.avatar?.trim();
  const directAvatarUrl = formatImageUrl(rawAvatar);
  const proxyAvatarUrl = getProxyImageUrl(rawAvatar);

  let currentAvatarSrc = '';
  if (rawAvatar && imgFallbackStage === 0) {
    currentAvatarSrc = directAvatarUrl;
  } else if (rawAvatar && imgFallbackStage === 1) {
    currentAvatarSrc = proxyAvatarUrl;
  }

  // Format admission date helper
  const formatAdmissionDate = (dateStr?: string) => {
    if (!dateStr) return 'Academic Session: 2026 to 2027';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch (_) {}
    return dateStr;
  };

  // Combine enrolled course names
  const courseNames =
    enrolledCourses.length > 0
      ? enrolledCourses.map((c) => c.title).join(', ')
      : student.courseTitle || 'Computer Course';

  // Clean time string to ensure (Morning) / (Evening) is removed
  const cleanTime = (student.batchTiming || '07:00 AM - 08:00 AM')
    .replace(/\s*\((Morning|Evening)\)/gi, '')
    .trim();

  // Effective courses to display in the new section
  const displayCourses = enrolledCourses.length > 0 ? enrolledCourses : allCourses.slice(0, 1);

  return (
    <div className="pt-4 sm:pt-6 pb-16 px-4 flex flex-col items-center gap-6 bg-stone-50 min-h-[calc(100vh-140px)]">
      {/* Student Profile Card with theme warm amber/stone background borders */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl shadow-stone-200/50 relative flex flex-col items-center">
        {/* Top-Left Back Navigation Button */}
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-5 left-5 p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-xs cursor-pointer z-10"
          title="Go Back"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Large Profile Circle Container with Amber/Orange Border */}
        <div className="relative mt-1 mb-2">
          {/* Main Circle */}
          <button
            type="button"
            onClick={handleCircleClick}
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 sm:border-[5px] border-amber-400 overflow-hidden bg-stone-900 flex items-center justify-center shadow-md shrink-0 relative group transition-transform duration-200 cursor-pointer hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-amber-400/30"
            title="Click to view full image"
            aria-label="Click to view full image"
          >
            {currentAvatarSrc && imgFallbackStage < 2 ? (
              <>
                <img
                  key={`avatar-${currentAvatarSrc}-${imgFallbackStage}`}
                  src={currentAvatarSrc}
                  alt={student.name}
                  onLoad={() => setIsMainImgLoaded(true)}
                  onError={() => {
                    if (imgFallbackStage === 0 && proxyAvatarUrl && proxyAvatarUrl !== directAvatarUrl) {
                      setImgFallbackStage(1);
                    } else {
                      setImgFallbackStage(2);
                    }
                  }}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isMainImgLoaded ? 'opacity-100' : 'opacity-80'
                  }`}
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="async"
                />
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-1.5 p-2">
                  <ZoomIn className="w-8 h-8 text-white drop-shadow-md" />
                  <span className="text-xs font-bold tracking-wide drop-shadow-md">
                    View Full Photo
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-stone-900 text-amber-400 flex items-center justify-center group-hover:bg-stone-800 transition-colors">
                {student.name ? (
                  <span className="text-6xl sm:text-7xl font-black tracking-tight">
                    {student.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="w-24 h-24 text-stone-400 stroke-[1.5]" />
                )}
              </div>
            )}
          </button>
        </div>

        {/* Centered Large Name in Theme Color */}
        <div className="w-full text-center mt-2 mb-1 px-2">
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
            {student.name}
          </h1>
        </div>

        {/* Key-Value Details - All accurately matching Student Registration Form */}
        <div className="w-full mt-3 pt-4 border-t border-stone-200 space-y-3 sm:space-y-3.5 text-sm sm:text-base">
          {/* Roll No */}
          <div className="flex items-start gap-3">
            <span className="font-extrabold text-stone-900 shrink-0 min-w-[95px]">
              Roll No:
            </span>
            <span className="font-mono font-bold text-stone-900 break-words">
              {student.rollNumber}
            </span>
          </div>

          {/* Course */}
          <div className="flex items-start gap-3">
            <span className="font-extrabold text-stone-900 shrink-0 min-w-[95px]">
              Course:
            </span>
            <span className="text-stone-800 font-semibold leading-snug break-words">
              {courseNames}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <span className="font-extrabold text-stone-900 shrink-0 min-w-[95px]">
              Time:
            </span>
            <span className="font-semibold text-stone-800">
              {cleanTime}
            </span>
          </div>

          {/* Contact Phone */}
          {student.phone && (
            <div className="flex items-start gap-3">
              <span className="font-extrabold text-stone-900 shrink-0 min-w-[95px]">
                Phone:
              </span>
              <a
                href={`tel:${student.phone.replace(/\D/g, '')}`}
                className="font-mono font-bold text-stone-800 hover:text-amber-700 transition-colors flex items-center gap-1.5"
                title="Call student"
              >
                <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{student.phone}</span>
              </a>
            </div>
          )}

          {/* Email Address */}
          {student.email && (
            <div className="flex items-start gap-3">
              <span className="font-extrabold text-stone-900 shrink-0 min-w-[95px]">
                Email:
              </span>
              <a
                href={`mailto:${student.email}`}
                className="font-semibold text-stone-800 hover:text-amber-700 transition-colors break-all text-xs sm:text-sm flex items-center gap-1.5"
                title="Send email to student"
              >
                <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{student.email}</span>
              </a>
            </div>
          )}

          {/* Admission Date & Academic Session */}
          <div className="flex items-start gap-3">
            <span className="font-extrabold text-stone-900 shrink-0 min-w-[95px]">
              Admission:
            </span>
            <div className="flex flex-col">
              <span className="font-mono font-bold text-stone-900">
                {student.joinedDate ? formatAdmissionDate(student.joinedDate) : '2026 to 2027'}
              </span>
              <span className="text-[11px] text-stone-500 font-medium mt-0.5">
                Academic Session: 2026 to 2027
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-stone-900 shrink-0 min-w-[95px]">
              Status:
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                student.status === 'Completed'
                  ? 'bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs'
                  : student.status === 'Active'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  : 'bg-stone-100 text-stone-800 border border-stone-200'
              }`}
            >
              {student.status === 'Completed' ? (
                <>
                  <Award className="w-3.5 h-3.5 text-blue-700" />
                  <span>Course Completed</span>
                </>
              ) : (
                <span>{student.status || 'Active'}</span>
              )}
            </span>
          </div>

          {/* Fee Overview (If configured) */}
          {student.totalFee && student.totalFee > 0 ? (
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-600 bg-stone-50/90 px-3 py-2 rounded-xl">
              <span className="text-stone-600 font-bold">Course Fee:</span>
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <span>₹{student.totalFee.toLocaleString('en-IN')}</span>
                {student.dueAmount !== undefined && student.dueAmount <= 0 ? (
                  <span className="text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                    Paid
                  </span>
                ) : null}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION: CONTINUE WATCHING (PROMINENT RESUME CARD)           */}
      {/* ============================================================ */}
      {continueWatching && continueWatching.timestampSeconds !== undefined && (
        <div className="max-w-md w-full">
          <div className="bg-white border-2 border-amber-500 rounded-3xl p-5 sm:p-6 shadow-xl shadow-orange-500/10 space-y-3.5 relative overflow-hidden">
            {/* Top Indicator Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                </span>
                <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Continue Watching
                </span>
              </div>
              {continueWatching.lastWatchedAt && (
                <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-400" />
                  {formatRelativeTime(continueWatching.lastWatchedAt)}
                </span>
              )}
            </div>

            {/* Course & Topic Information */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block truncate">
                {continueWatching.courseTitle || 'Enrolled Course'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-stone-900 leading-snug break-words">
                {continueWatching.moduleName || continueWatching.videoTitle || 'Lecture Video'}
              </h3>
            </div>

            {/* Playback timestamp progress bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-700">
                <span className="text-orange-600 font-bold">
                  Resuming at {formatSeconds(continueWatching.timestampSeconds)}
                </span>
                {continueWatching.durationSeconds && continueWatching.durationSeconds > 0 ? (
                  <span className="text-stone-400">
                    Total: {formatSeconds(continueWatching.durationSeconds)}
                  </span>
                ) : null}
              </div>

              {continueWatching.durationSeconds && continueWatching.durationSeconds > 0 ? (
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          6,
                          Math.round(
                            (continueWatching.timestampSeconds / continueWatching.durationSeconds) * 100
                          )
                        )
                      )}%`,
                    }}
                  ></div>
                </div>
              ) : null}
            </div>

            {/* Resume Button */}
            <button
              type="button"
              onClick={handleResumeContinueWatching}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.99] text-white font-black text-sm tracking-wide shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer group/btn"
            >
              <Play className="w-4 h-4 fill-white text-white group-hover/btn:scale-110 transition-transform" />
              <span>Resume Lecture</span>
              <ChevronRight className="w-4 h-4 ml-auto text-amber-100 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION: ENROLLED COURSES & "SEE COURSE" LEARNING PORTAL     */}
      {/* ============================================================ */}
      <div className="max-w-md w-full space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              My Enrolled Courses & Study Portal
            </h2>
          </div>
        </div>

        {/* Course Cards with "See Course" Action */}
        <div className="space-y-4">
          {displayCourses.map((crs) => {
            const courseProgress = watchProgressMap[crs.id];

            return (
              <div
                key={crs.id}
                className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-md shadow-stone-200/40 space-y-4 transition-all hover:shadow-xl hover:border-amber-400 relative overflow-hidden group"
              >
                {/* Course Header Banner */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-stone-900 text-amber-400 text-[10px] font-black rounded-full uppercase tracking-wider">
                        {crs.code}
                      </span>
                      <span className="text-[11px] font-bold text-stone-500">
                        {crs.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-stone-900 leading-snug group-hover:text-orange-600 transition-colors">
                      {crs.title}
                    </h3>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-orange-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </div>

                {/* Course Meta Info */}
                <div className="pt-2 border-t border-stone-100 text-xs">
                  <div className="flex items-center gap-1.5 text-stone-600 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Duration: {crs.duration}</span>
                  </div>
                </div>

                {/* If there is saved watch progress for this course, show resume badge */}
                {courseProgress && courseProgress.timestampSeconds > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Play className="w-3.5 h-3.5 fill-orange-600 text-orange-600 shrink-0" />
                      <span className="text-amber-950 font-bold truncate">
                        {courseProgress.moduleName || `Topic ${courseProgress.topicIndex + 1}`}
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-orange-700 shrink-0">
                      {formatSeconds(courseProgress.timestampSeconds)}
                    </span>
                  </div>
                )}

                {/* Features Pill Box */}
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-around text-center text-xs">
                  <div className="flex items-center gap-1.5 text-stone-700 font-bold">
                    <Video className="w-4 h-4 text-orange-600" />
                    <span>Topic Videos</span>
                  </div>
                  <div className="w-px h-4 bg-stone-300"></div>
                  <div className="flex items-center gap-1.5 text-stone-700 font-bold">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Downloadable PDFs</span>
                  </div>
                </div>

                {/* PROMINENT AMBER/ORANGE "SEE COURSE" / "RESUME" BUTTON */}
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCourseClick(
                        crs,
                        courseProgress?.topicIndex,
                        courseProgress?.timestampSeconds
                      )
                    }
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.99] text-white font-black text-sm tracking-wide shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer group/btn"
                  >
                    <Play className="w-4 h-4 fill-white text-white group-hover/btn:translate-x-0.5 transition-transform" />
                    <span>
                      {courseProgress && courseProgress.timestampSeconds > 5
                        ? `Resume (${formatSeconds(courseProgress.timestampSeconds)})`
                        : 'See Course'}
                    </span>
                    <ChevronRight className="w-4 h-4 ml-auto text-amber-100 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION: CERTIFICATION SECTION (LOCKED / UNLOCKED)           */}
      {/* ============================================================ */}
      <div className="max-w-md w-full space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-500" />
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              Course Certification & Credential
            </h2>
          </div>
        </div>

        {/* LOCKED STATE (WHEN STUDENT IS NOT COMPLETED) */}
        {student.status !== 'Completed' ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-500 border border-stone-200 flex items-center justify-center shrink-0 shadow-inner">
                  <Lock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-800">
                    Official Certificate Locked
                  </h3>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                disabled
                className="w-full py-3.5 px-4 rounded-2xl bg-stone-100 border border-stone-200 text-stone-400 text-xs font-black flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Locked • Complete Course to Unlock</span>
              </button>
            </div>
          </div>
        ) : (
          /* UNLOCKED STATE (WHEN STUDENT STATUS IS 'Completed') */
          <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 shadow-xl shadow-amber-500/10 space-y-5 relative overflow-hidden">
            {/* Top Amber Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/25 ring-4 ring-amber-100">
                  <Award className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 uppercase tracking-wider border border-amber-200">
                      Unlocked & Certified
                    </span>
                  </div>
                  <h3 className="text-base font-black text-stone-900 mt-0.5">
                    Official Course Certificate
                  </h3>
                </div>
              </div>
            </div>

            {/* Credential Metadata Badges */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-0.5">
                <span className="text-[10px] text-stone-400 block font-bold uppercase font-sans">Certificate No.</span>
                <span className="font-black text-stone-900 truncate block text-xs sm:text-sm">
                  {certificate?.certificateNumber || student.certificateNumber || `CERT-2026-${student.rollNumber.replace(/\D/g, '') || '101'}`}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-0.5">
                <span className="text-[10px] text-stone-400 block font-bold uppercase font-sans">Grade</span>
                <span className="font-black text-orange-700 truncate block text-xs sm:text-sm">
                  {certificate?.grade || student.certificateGrade || 'A+ (Distinction)'}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-0.5 col-span-2">
                <span className="text-[10px] text-stone-400 block font-bold uppercase font-sans">Course Title</span>
                <span className="font-bold text-stone-800 truncate block text-xs">
                  {certificate?.courseTitle || student.courseTitle || 'Computer Course'}
                </span>
              </div>
            </div>

            {/* Action Buttons: Preview & Download */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Fullscreen Preview Button */}
              <button
                type="button"
                onClick={() => setShowCertModal(true)}
                className="py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-stone-900/10"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Preview</span>
              </button>

              {/* Download Certificate Button */}
              <a
                href={certificate?.certificateUrl || student.certificateUrl || '#'}
                download={`Certificate_${student.rollNumber}.jpg`}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer text-center"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* FULLSCREEN CERTIFICATE PREVIEW MODAL */}
      {showCertModal && student.status === 'Completed' && (certificate?.certificateUrl || student.certificateUrl) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={() => setShowCertModal(false)}
        >
          <button
            type="button"
            onClick={() => setShowCertModal(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-sm"
            title="Close Preview"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div
            className="relative flex flex-col items-center justify-center max-w-4xl w-full max-h-[90vh] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-2xl overflow-hidden bg-stone-900 border border-white/20 shadow-2xl">
              <img
                src={certificate?.certificateUrl || student.certificateUrl}
                alt={`Certificate for ${student.name}`}
                className="max-h-[75vh] w-auto max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex items-center gap-3">
              <a
                href={certificate?.certificateUrl || student.certificateUrl}
                target="_blank"
                rel="noreferrer"
                download={`Certificate_${student.rollNumber}.jpg`}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Certificate File</span>
              </a>

              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSTAGRAM-STYLE FULL IMAGE VIEWER */}
      {showFullImageModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Profile Photo Viewer"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={handleCloseImageModal}
        >
          {/* Top-Right Floating Minimal Close Button */}
          <button
            type="button"
            onClick={handleCloseImageModal}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-sm"
            title="Close"
            aria-label="Close"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Clean Centered Image */}
          <div
            className="relative flex items-center justify-center max-w-[92vw] max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {currentAvatarSrc && imgFallbackStage < 2 ? (
              <img
                src={currentAvatarSrc}
                alt={student.name}
                className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-2xl sm:rounded-3xl shadow-2xl drop-shadow-2xl animate-in zoom-in-95 duration-200"
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center shadow-2xl border-4 border-amber-500/50">
                <span className="text-7xl sm:text-8xl font-black">
                  {student.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
