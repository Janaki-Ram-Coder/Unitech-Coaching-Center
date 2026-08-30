import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Menu,
  X,
  Play,
  Download,
  Video,
  ExternalLink,
  AlertCircle,
  Eye,
  FileText,
  ChevronRight,
  RotateCcw,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, LearningResource, User, WatchProgress } from '../types';
import { apiFetch } from '../lib/api';
import { formatSeconds, formatRelativeTime } from '../lib/timeUtils';
import { CourseLearningSkeleton } from '../components/Skeleton';
import { formatImageUrl } from '../lib/imageUtils';

interface CourseLearningPageProps {
  courseId?: string;
  initialCourse?: Course | null;
  initialTopicIndex?: number;
  initialTimestamp?: number;
  user?: User | null;
  onBack: () => void;
  onNavigateToCourseDetail?: (course: Course) => void;
}

interface TopicGroup {
  moduleName: string;
  order: number;
  videoResource?: LearningResource;
  pdfResources: LearningResource[];
  attachedPdfUrl?: string;
  attachedPdfTitle?: string;
}

export const CourseLearningPage: React.FC<CourseLearningPageProps> = ({
  courseId,
  initialCourse,
  initialTopicIndex,
  initialTimestamp,
  user,
  onBack,
}) => {
  const [course, setCourse] = useState<Course | null>(initialCourse || null);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation state: selected topic index & burger menu open state
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(() => {
    return initialTopicIndex !== undefined ? initialTopicIndex : 0;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // PDF Viewer Modal
  const [previewPdf, setPreviewPdf] = useState<{ url: string; title: string } | null>(null);

  // Video playback & Continue Watching state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [savedProgress, setSavedProgress] = useState<WatchProgress | null>(null);
  const [resumeNotification, setResumeNotification] = useState<{
    show: boolean;
    timestamp: number;
    topicName: string;
  } | null>(null);

  // Refs for tracking video playback and throttle timers
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasAutoResumedRef = useRef<boolean>(false);
  const lastSavedTimestampRef = useRef<number>(0);
  const throttleTimerRef = useRef<any>(null);
  const targetResumeTimestampRef = useRef<number>(initialTimestamp || 0);

  // Load Course and Resources
  useEffect(() => {
    loadCourseAndResources();
  }, [courseId]);

  const loadCourseAndResources = async () => {
    setLoading(true);
    setError('');
    try {
      let currentCourse = initialCourse;
      if (!currentCourse && courseId) {
        const allCourses = await apiFetch<Course[]>('/api/courses');
        currentCourse = allCourses.find((c) => c.id === courseId) || null;
        if (currentCourse) setCourse(currentCourse);
      }

      const targetCourseId = courseId || currentCourse?.id;
      if (targetCourseId) {
        const [resList, progressRes] = await Promise.all([
          apiFetch<LearningResource[]>(`/api/resources?courseId=${targetCourseId}`),
          apiFetch<{ progress?: WatchProgress | null }>('/api/student/watch-progress?courseId=' + targetCourseId).catch(() => ({ progress: null })),
        ]);
        setResources(resList);

        // Check for saved progress (either from backend API or local storage fallback)
        let prog: WatchProgress | null = progressRes?.progress || null;
        if (!prog && typeof window !== 'undefined') {
          const localStored = localStorage.getItem(`unitech_watch_progress_${targetCourseId}`);
          if (localStored) {
            try {
              prog = JSON.parse(localStored);
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }

        if (prog) {
          setSavedProgress(prog);

          // If initial props did not override topic index, use saved progress
          if (initialTopicIndex === undefined && prog.topicIndex !== undefined) {
            setSelectedTopicIndex(prog.topicIndex);
          }

          const targetTime = initialTimestamp !== undefined ? initialTimestamp : prog.timestampSeconds;
          if (targetTime > 5) {
            targetResumeTimestampRef.current = targetTime;
            setResumeNotification({
              show: true,
              timestamp: targetTime,
              topicName: prog.moduleName || `Topic ${(prog.topicIndex || 0) + 1}`,
            });
          }
        }
      } else {
        const resList = await apiFetch<LearningResource[]>('/api/resources');
        setResources(resList);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load course video lectures and study notes.');
    } finally {
      setLoading(false);
    }
  };

  // Group Resources into cohesive Topics / Modules
  const topicGroups: TopicGroup[] = useMemo(() => {
    if (!resources || resources.length === 0) return [];

    const map = new Map<string, TopicGroup>();

    resources.forEach((r, idx) => {
      const modName = (r.moduleName && r.moduleName.trim()) || `Topic ${idx + 1}`;
      if (!map.has(modName)) {
        map.set(modName, {
          moduleName: modName,
          order: r.order || idx + 1,
          pdfResources: [],
        });
      }

      const group = map.get(modName)!;
      if (r.order !== undefined && r.order < group.order) {
        group.order = r.order;
      }

      if (r.type === 'video') {
        if (!group.videoResource) {
          group.videoResource = r;
        }
        if (r.pdfUrl && !group.attachedPdfUrl) {
          group.attachedPdfUrl = r.pdfUrl;
          group.attachedPdfTitle = r.pdfTitle || `${r.title} Notes.pdf`;
        }
      } else if (r.type === 'pdf') {
        group.pdfResources.push(r);
      }
    });

    const groups = Array.from(map.values());
    groups.sort((a, b) => a.order - b.order);
    return groups;
  }, [resources]);

  // Active Topic Group
  const activeTopic: TopicGroup | undefined = topicGroups[selectedTopicIndex] || topicGroups[0];
  const activeVideo = activeTopic?.videoResource;
  
  // All notes available for active topic
  const activeTopicPdfs = useMemo(() => {
    if (!activeTopic) return [];
    const list: { id: string; title: string; url: string; description?: string; sizeMb?: number }[] = [];

    if (activeTopic.attachedPdfUrl) {
      list.push({
        id: `attached-${activeTopic.moduleName}`,
        title: activeTopic.attachedPdfTitle || `${activeTopic.moduleName} Notes`,
        url: activeTopic.attachedPdfUrl,
        sizeMb: 3.8,
      });
    }

    activeTopic.pdfResources.forEach((p) => {
      if (!list.some((existing) => existing.url === p.url)) {
        list.push({
          id: p.id,
          title: p.title,
          url: p.url,
          sizeMb: p.fileSizeMb || 4.2,
        });
      }
    });

    return list;
  }, [activeTopic]);

  // Save watch progress to backend and localStorage
  const saveProgressToBackend = useCallback(
    async (timestampSeconds: number, durationSeconds?: number) => {
      const targetCourseId = courseId || course?.id;
      if (!targetCourseId || !activeTopic) return;

      const progressData: WatchProgress = {
        courseId: targetCourseId,
        courseTitle: course?.title || 'Enrolled Course',
        topicIndex: selectedTopicIndex,
        moduleName: activeTopic.moduleName,
        resourceId: activeVideo?.id,
        videoTitle: activeVideo?.title || activeTopic.moduleName,
        videoUrl: activeVideo?.url,
        timestampSeconds: Math.floor(timestampSeconds),
        durationSeconds: durationSeconds ? Math.floor(durationSeconds) : undefined,
        lastWatchedAt: new Date().toISOString(),
      };

      // Always persist to localStorage for instant offline recovery
      try {
        localStorage.setItem(`unitech_watch_progress_${targetCourseId}`, JSON.stringify(progressData));
      } catch (e) {
        // LocalStorage quota or privacy setting error
      }

      setSavedProgress(progressData);
      lastSavedTimestampRef.current = timestampSeconds;

      // Persist to user profile backend
      try {
        await apiFetch('/api/student/watch-progress', {
          method: 'POST',
          body: JSON.stringify(progressData),
        });
      } catch (err) {
        // Background sync error - silently ignore
      }
    },
    [courseId, course?.id, course?.title, activeTopic, selectedTopicIndex, activeVideo]
  );

  // Clean up timer on unmount and save final position
  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      if (videoRef.current) {
        const time = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        if (time > 0) {
          saveProgressToBackend(time, dur);
        }
      }
    };
  }, [saveProgressToBackend]);

  // Handle downloading the exact uploaded file from the admin
  const handleDownloadFile = async (fileUrl: string, fileTitle?: string) => {
    if (!fileUrl) return;

    const defaultName = (fileTitle || activeTopic?.moduleName || 'Study_Material').trim().replace(/[/\\?%*:|"<>]/g, '_');
    let filename = defaultName;

    try {
      const parsedUrl = new URL(fileUrl, window.location.href);
      const pathname = parsedUrl.pathname;
      const extMatch = pathname.match(/\.([a-zA-Z0-9]+)$/);
      if (extMatch && extMatch[1] && !filename.toLowerCase().endsWith(`.${extMatch[1].toLowerCase()}`)) {
        filename = `${filename}.${extMatch[1]}`;
      } else if (!filename.includes('.')) {
        filename = `${filename}.pdf`;
      }
    } catch {
      if (!filename.includes('.')) {
        filename = `${filename}.pdf`;
      }
    }

    try {
      if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const res = await fetch(fileUrl, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        return;
      }
    } catch (err) {
      // Cross-origin fallback
    }

    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle Video Time Update with throttled backend sync
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const time = video.currentTime;
    const dur = video.duration || duration;
    setCurrentTime(time);
    if (dur && isFinite(dur)) {
      setDuration(dur);
    }

    // Throttle backend save to every 4 seconds
    if (Math.abs(time - lastSavedTimestampRef.current) >= 4) {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      throttleTimerRef.current = setTimeout(() => {
        saveProgressToBackend(time, dur);
      }, 500);
    }
  };

  // Handle Metadata Loaded (Seek to saved position if resuming)
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const dur = video.duration;
    if (dur && isFinite(dur)) {
      setDuration(dur);
    }

    const targetTime = targetResumeTimestampRef.current;
    if (targetTime > 0 && !hasAutoResumedRef.current && dur > targetTime) {
      video.currentTime = targetTime;
      hasAutoResumedRef.current = true;
    }
  };

  // Restart video from beginning
  const handleRestartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    setCurrentTime(0);
    targetResumeTimestampRef.current = 0;
    setResumeNotification(null);
    saveProgressToBackend(0, duration);
  };

  // Handle switching topics
  const handleSelectTopic = (index: number) => {
    if (index === selectedTopicIndex) {
      setIsMenuOpen(false);
      return;
    }

    // Save current video position before switching
    if (videoRef.current && videoRef.current.currentTime > 0) {
      saveProgressToBackend(videoRef.current.currentTime, videoRef.current.duration);
    }

    setSelectedTopicIndex(index);
    setIsMenuOpen(false);
    hasAutoResumedRef.current = false;
    targetResumeTimestampRef.current = 0;
    setCurrentTime(0);
    setResumeNotification(null);

    // Save initial 0 timestamp for new topic
    setTimeout(() => {
      saveProgressToBackend(0, 0);
    }, 200);
  };

  // Helper to detect YouTube URL and create embed URL with resume start timestamp
  const getEmbedVideoUrl = (url?: string, startSec?: number): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      const startParam = startSec && startSec > 5 ? `&start=${Math.floor(startSec)}` : '';
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&modestbranding=1&rel=0${startParam}`;
    }
    return null;
  };

  if (loading) {
    return <CourseLearningSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">{error || 'Course details not found'}</h2>
      </div>
    );
  }

  if (topicGroups.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-800 mx-auto flex items-center justify-center">
            <Video className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Curriculum Videos Uploading</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Faculty instructors are currently uploading syllabus recordings and study materials for{' '}
            <span className="font-bold text-slate-900">{course.title}</span>.
          </p>
        </div>
      </div>
    );
  }

  const youtubeEmbed = activeVideo
    ? getEmbedVideoUrl(activeVideo.url, targetResumeTimestampRef.current)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-5">
      {/* ============================================================ */}
      {/* HOME-STYLE WHITE MENU BAR WITH BLACK BURGER MENU ICON        */}
      {/* ============================================================ */}
      <header className="bg-white border border-slate-200 rounded-2xl shadow-xs transition-all relative z-30">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          {/* Burger Menu Button (Black Icon, White Button) + Active Topic Info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-black border border-slate-200 transition-colors cursor-pointer shadow-xs flex items-center gap-2 shrink-0"
              title="Toggle Topics Menu"
              aria-label="Toggle Topics Menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-black stroke-[2.5]" />
              ) : (
                <Menu className="w-5 h-5 text-black stroke-[2.5]" />
              )}
              <span className="text-xs font-bold text-black hidden sm:inline">Topics</span>
            </button>

            <div className="h-5 w-px bg-slate-200"></div>

            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight truncate">
                {course.title}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate block leading-tight">
                {activeTopic?.moduleName}
              </span>
            </div>
          </div>

          {/* Topic Counter Badge */}
          <div className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-[11px] font-mono font-bold shrink-0">
            {selectedTopicIndex + 1} / {topicGroups.length}
          </div>
        </div>

        {/* Drawer for Topics (Matches Home Navbar Dropdown style) */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2 overflow-hidden rounded-b-2xl shadow-lg"
            >
              <div className="pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block truncate">
                  Course Curriculum Topics
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {topicGroups.map((group, idx) => {
                  const isSelected = selectedTopicIndex === idx;
                  const isLastWatched = savedProgress?.topicIndex === idx;

                  return (
                    <button
                      key={group.moduleName || idx}
                      type="button"
                      onClick={() => handleSelectTopic(idx)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 text-black border-slate-300 font-extrabold shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                            isSelected
                              ? 'bg-black text-white'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs truncate font-semibold block">
                            {group.moduleName}
                          </span>
                          {isLastWatched && savedProgress?.timestampSeconds ? (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Last watched at {formatSeconds(savedProgress.timestampSeconds)}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLastWatched && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            Resume
                          </span>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-black' : 'text-slate-400'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ============================================================ */}
      {/* CONTINUE WATCHING RESUME NOTIFICATION BANNER                 */}
      {/* ============================================================ */}
      {resumeNotification && resumeNotification.show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-emerald-950 truncate">
                Resumed from <span className="font-mono font-black underline">{formatSeconds(resumeNotification.timestamp)}</span> in{' '}
                <span className="font-semibold">{resumeNotification.topicName}</span>
              </p>
              <p className="text-[11px] text-emerald-700">
                Your progress is automatically saved to your student profile.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleRestartVideo}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3 h-3 text-emerald-800" />
              <span>Start from 0:00</span>
            </button>
            <button
              type="button"
              onClick={() => setResumeNotification(null)}
              className="p-1.5 text-emerald-700 hover:text-emerald-950 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* VIDEO SECTION (SEAMLESS CLEAN FIT WITHOUT BLACK BARS)        */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        {/* Topic Heading & Progress Bar */}
        <div className="border-b border-slate-100 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug break-words">
            {activeTopic?.moduleName || activeVideo?.title || 'Topic Lecture Video'}
          </h1>

          {/* Real-time playback timestamp badge */}
          {currentTime > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-mono font-bold shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span>
                {formatSeconds(currentTime)}
                {duration > 0 ? ` / ${formatSeconds(duration)}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Video Player (Seamlessly fills the container with NO black letterboxing bands) */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-xs relative w-full aspect-video flex items-center justify-center">
          {youtubeEmbed ? (
            <iframe
              src={youtubeEmbed}
              title={activeVideo?.title || activeTopic?.moduleName || 'Course Lecture Video'}
              className="w-full h-full border-0 absolute inset-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          ) : activeVideo?.url &&
            (activeVideo.url.endsWith('.mp4') ||
              activeVideo.url.endsWith('.webm') ||
              activeVideo.url.includes('commondatastorage')) ? (
            <video
              ref={videoRef}
              key={activeVideo.url}
              src={activeVideo.url}
              controls
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPause={() => {
                if (videoRef.current) {
                  saveProgressToBackend(videoRef.current.currentTime, videoRef.current.duration);
                }
              }}
              onEnded={() => {
                if (videoRef.current) {
                  saveProgressToBackend(videoRef.current.currentTime, videoRef.current.duration);
                }
              }}
              className="w-full h-full object-cover absolute inset-0"
              poster={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"}
            >
              Your browser does not support HTML5 video playback.
            </video>
          ) : activeVideo?.url ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50 relative overflow-hidden">
              {course.thumbnail && (
                <img
                  src={formatImageUrl(course.thumbnail)}
                  alt={course.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
              )}
              <div className="relative z-10 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-900 mx-auto flex items-center justify-center">
                  <Play className="w-6 h-6 fill-slate-900 text-slate-900 ml-0.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 max-w-md">{activeVideo.title}</h3>
                  {activeVideo.description && (
                    <p className="text-xs text-slate-600 mt-1 max-w-md line-clamp-2">{activeVideo.description}</p>
                  )}
                </div>
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => saveProgressToBackend(1, 100)}
                  className="px-4 py-2 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open Video Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50 relative overflow-hidden">
              {course.thumbnail && (
                <img
                  src={formatImageUrl(course.thumbnail)}
                  alt={course.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  className="absolute inset-0 w-full h-full object-cover opacity-15"
                />
              )}
              <div className="relative z-10 space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-700 mx-auto flex items-center justify-center">
                  <Video className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{activeTopic?.moduleName || 'Topic Lecture'}</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                    Topic lecture video is being updated. Study notes and PDF resources are available below.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TOPIC NOTES SECTION (CLEAN WHITE CARD, PROPER TEXT WRAP)    */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        {/* Topic Heading */}
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 break-words leading-tight">
          {activeTopic?.moduleName || 'Topic Study Notes'}
        </h2>

        {/* Note Items */}
        <div className="space-y-2.5">
          {activeTopicPdfs.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
              No downloadable study files uploaded for this topic yet.
            </div>
          ) : (
            activeTopicPdfs.map((pdf, idx) => (
              <div
                key={pdf.id || idx}
                className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 overflow-hidden shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm break-words leading-snug">
                      {pdf.title || `${activeTopic?.moduleName || 'Topic'} Notes`}
                    </h3>
                  </div>
                </div>

                {/* Action Buttons: Preview & Download */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPreviewPdf({ url: pdf.url, title: pdf.title })}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-700" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile(pdf.url, pdf.title)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-black hover:bg-slate-800 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="Download Uploaded Study File"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* IN-APP PDF DOCUMENT PREVIEW MODAL */}
      {/* ============================================================ */}
      {previewPdf && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notes PDF Viewer"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setPreviewPdf(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{previewPdf.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewPdf.url, previewPdf.title)}
                  className="px-3.5 py-1.5 bg-black hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  title="Download Uploaded File"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPdf(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close Viewer"
                  aria-label="Close Viewer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* PDF Embed Content */}
            <div className="flex-1 p-2 bg-slate-50 min-h-[480px] flex items-center justify-center relative">
              <iframe
                src={`${previewPdf.url}#toolbar=1`}
                title={previewPdf.title}
                className="w-full h-[65vh] rounded-xl border border-slate-200 bg-white"
              >
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">PDF Preview cannot be rendered directly.</p>
                  <a
                    href={previewPdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-black text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
