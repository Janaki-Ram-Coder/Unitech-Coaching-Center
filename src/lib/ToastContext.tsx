import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  Trash2,
  UserCheck,
  UserX,
  BookOpen,
  Sparkles,
  FileCheck,
  Award,
  Video,
  FileText,
  X,
  Layers,
  Edit3,
  Info,
} from 'lucide-react';

export type ToastType =
  | 'create_course'
  | 'update_course'
  | 'delete_course'
  | 'create_student'
  | 'update_student'
  | 'delete_student'
  | 'upload_resource'
  | 'delete_resource'
  | 'upload_certificate'
  | 'delete_certificate'
  | 'success'
  | 'delete'
  | 'error'
  | 'warning'
  | 'info';

export interface ActionToast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  highlightText?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ActionToast, 'id'>) => void;
  success: (titleOrMessage: string, message?: string, highlightText?: string) => void;
  error: (titleOrMessage: string, message?: string) => void;
  info: (titleOrMessage: string, message?: string) => void;
  warning: (titleOrMessage: string, message?: string) => void;
  courseCreated: (courseTitle: string) => void;
  courseUpdated: (courseTitle: string) => void;
  courseDeleted: (courseTitle: string) => void;
  studentCreated: (studentName: string, rollNumber?: string) => void;
  studentUpdated: (studentName: string, rollNumber?: string) => void;
  studentDeleted: (studentName: string, rollNumber?: string) => void;
  resourceUploaded: (resourceTitle: string, type?: 'video' | 'pdf') => void;
  resourceDeleted: (resourceTitle: string) => void;
  certificateUploaded: (studentName: string, certNumber?: string) => void;
  certificateDeleted: (studentName: string) => void;
  enrollmentSubmitted: (studentName: string, courseTitle?: string, phone?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ActionToast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ActionToast, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ActionToast = {
        ...toast,
        id,
        duration: toast.duration || 4200,
      };

      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 active toasts

      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (titleOrMessage: string, message?: string, highlightText?: string) => {
      if (message === undefined) {
        showToast({ type: 'success', title: 'Success', message: titleOrMessage, highlightText });
      } else {
        showToast({ type: 'success', title: titleOrMessage, message, highlightText });
      }
    },
    [showToast]
  );

  const error = useCallback(
    (titleOrMessage: string, message?: string) => {
      if (message === undefined) {
        showToast({ type: 'error', title: 'Error', message: titleOrMessage });
      } else {
        showToast({ type: 'error', title: titleOrMessage, message });
      }
    },
    [showToast]
  );

  const info = useCallback(
    (titleOrMessage: string, message?: string) => {
      if (message === undefined) {
        showToast({ type: 'info', title: 'Information', message: titleOrMessage });
      } else {
        showToast({ type: 'info', title: titleOrMessage, message });
      }
    },
    [showToast]
  );

  const warning = useCallback(
    (titleOrMessage: string, message?: string) => {
      if (message === undefined) {
        showToast({ type: 'warning', title: 'Notice', message: titleOrMessage });
      } else {
        showToast({ type: 'warning', title: titleOrMessage, message });
      }
    },
    [showToast]
  );

  const courseCreated = useCallback(
    (courseTitle: string) => {
      showToast({
        type: 'create_course',
        title: 'Course Created Successfully!',
        message: 'New course curriculum has been added to catalog.',
        highlightText: courseTitle,
      });
    },
    [showToast]
  );

  const courseUpdated = useCallback(
    (courseTitle: string) => {
      showToast({
        type: 'update_course',
        title: 'Course Changes Saved!',
        message: 'Course syllabus and metadata updated.',
        highlightText: courseTitle,
      });
    },
    [showToast]
  );

  const courseDeleted = useCallback(
    (courseTitle: string) => {
      showToast({
        type: 'delete_course',
        title: 'Course Removed',
        message: 'Course has been permanently deleted.',
        highlightText: courseTitle,
      });
    },
    [showToast]
  );

  const studentCreated = useCallback(
    (studentName: string, rollNumber?: string) => {
      showToast({
        type: 'create_student',
        title: 'Student Registered Successfully!',
        message: 'Portal login account & admission records configured.',
        highlightText: rollNumber ? `${studentName} (${rollNumber})` : studentName,
      });
    },
    [showToast]
  );

  const studentUpdated = useCallback(
    (studentName: string, rollNumber?: string) => {
      showToast({
        type: 'update_student',
        title: 'Student Profile Updated!',
        message: 'Account details and status saved successfully.',
        highlightText: rollNumber ? `${studentName} (${rollNumber})` : studentName,
      });
    },
    [showToast]
  );

  const studentDeleted = useCallback(
    (studentName: string, rollNumber?: string) => {
      showToast({
        type: 'delete_student',
        title: 'Student Account Deleted',
        message: 'Student account & credentials have been removed.',
        highlightText: rollNumber ? `${studentName} (${rollNumber})` : studentName,
      });
    },
    [showToast]
  );

  const resourceUploaded = useCallback(
    (resourceTitle: string, type: 'video' | 'pdf' = 'video') => {
      showToast({
        type: 'upload_resource',
        title: type === 'video' ? 'Video Lesson Uploaded!' : 'Study Notes Uploaded!',
        message: `Material is now available for students in learning portal.`,
        highlightText: resourceTitle,
      });
    },
    [showToast]
  );

  const resourceDeleted = useCallback(
    (resourceTitle: string) => {
      showToast({
        type: 'delete_resource',
        title: 'Resource Deleted',
        message: 'Learning resource was removed from the module.',
        highlightText: resourceTitle,
      });
    },
    [showToast]
  );

  const certificateUploaded = useCallback(
    (studentName: string, certNumber?: string) => {
      showToast({
        type: 'upload_certificate',
        title: 'Certificate Issued & Saved!',
        message: 'Certificate uploaded and verified on student verification portal.',
        highlightText: certNumber ? `${studentName} • ${certNumber}` : studentName,
      });
    },
    [showToast]
  );

  const certificateDeleted = useCallback(
    (studentName: string) => {
      showToast({
        type: 'delete_certificate',
        title: 'Certificate Deleted',
        message: 'Certificate record has been removed.',
        highlightText: studentName,
      });
    },
    [showToast]
  );

  const enrollmentSubmitted = useCallback(
    (studentName: string, courseTitle?: string, phone?: string) => {
      showToast({
        type: 'success',
        title: 'Enrollment Enquiry Submitted!',
        message: phone
          ? `Thank you ${studentName}! Admission details will be shared on ${phone}.`
          : `Thank you ${studentName}! Our counselors will contact you shortly with batch schedules.`,
        highlightText: courseTitle ? `${studentName} • ${courseTitle}` : studentName,
        duration: 5000,
      });
    },
    [showToast]
  );

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'create_course':
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'update_course':
        return <Edit3 className="w-5 h-5 text-indigo-400" />;
      case 'delete_course':
        return <Trash2 className="w-5 h-5 text-rose-400" />;
      case 'create_student':
        return <UserCheck className="w-5 h-5 text-emerald-400" />;
      case 'update_student':
        return <CheckCircle2 className="w-5 h-5 text-indigo-400" />;
      case 'delete_student':
        return <UserX className="w-5 h-5 text-rose-400" />;
      case 'upload_resource':
        return <Video className="w-5 h-5 text-indigo-400" />;
      case 'delete_resource':
        return <Trash2 className="w-5 h-5 text-rose-400" />;
      case 'upload_certificate':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'delete_certificate':
        return <Trash2 className="w-5 h-5 text-rose-400" />;
      case 'delete':
        return <Trash2 className="w-5 h-5 text-rose-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-sky-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getToastColors = (type: ToastType) => {
    if (type.includes('delete') || type === 'error') {
      return {
        bg: 'bg-slate-950 border-rose-500/40 text-white shadow-rose-950/40',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        accentBar: 'bg-rose-500',
        pulseGlow: 'bg-rose-500/20',
      };
    }
    if (type === 'warning') {
      return {
        bg: 'bg-slate-950 border-amber-500/40 text-white shadow-amber-950/40',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        accentBar: 'bg-amber-500',
        pulseGlow: 'bg-amber-500/20',
      };
    }
    if (type === 'info') {
      return {
        bg: 'bg-slate-950 border-sky-500/40 text-white shadow-sky-950/40',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        accentBar: 'bg-sky-500',
        pulseGlow: 'bg-sky-500/20',
      };
    }
    if (type === 'upload_certificate' || type === 'update_course') {
      return {
        bg: 'bg-slate-950 border-indigo-500/40 text-white shadow-indigo-950/40',
        badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        accentBar: 'bg-indigo-500',
        pulseGlow: 'bg-indigo-500/20',
      };
    }
    return {
      bg: 'bg-slate-950 border-emerald-500/40 text-white shadow-emerald-950/40',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      accentBar: 'bg-emerald-500',
      pulseGlow: 'bg-emerald-500/20',
    };
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        info,
        warning,
        courseCreated,
        courseUpdated,
        courseDeleted,
        studentCreated,
        studentUpdated,
        studentDeleted,
        resourceUploaded,
        resourceDeleted,
        certificateUploaded,
        certificateDeleted,
        enrollmentSubmitted,
      }}
    >
      {children}

      {/* Floating Animated Toast Container */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-full px-3">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const colors = getToastColors(toast.type);

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.92, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.88, x: 60, filter: 'blur(4px)' }}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 30,
                  mass: 0.8,
                }}
                className={`relative overflow-hidden pointer-events-auto rounded-2xl border backdrop-blur-xl p-4 sm:p-4.5 shadow-2xl ${colors.bg}`}
              >
                {/* Dynamic animated glow background */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: 0.35 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`absolute -top-12 -left-12 w-28 h-28 rounded-full blur-2xl ${colors.pulseGlow} pointer-events-none`}
                />

                {/* Left accent color bar */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${colors.accentBar}`} />

                {/* Content */}
                <div className="flex items-start gap-3.5 pl-1.5">
                  {/* Icon with animated pulse */}
                  <motion.div
                    initial={{ rotate: -15, scale: 0.7 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${colors.badge}`}
                  >
                    {getToastIcon(toast.type)}
                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-white tracking-tight">
                        {toast.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeToast(toast.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {toast.highlightText && (
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-[11px] font-bold truncate max-w-full border border-white/10">
                          {toast.highlightText}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                      {toast.message}
                    </p>
                  </div>
                </div>

                {/* Animated progress bar */}
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: (toast.duration || 4200) / 1000, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-0.5 ${colors.accentBar} opacity-80`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
