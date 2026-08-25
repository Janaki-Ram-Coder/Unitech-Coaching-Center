import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Users,
  Search,
  KeyRound,
  Share2,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Edit2,
  Trash2,
  Sparkles,
  ShieldCheck,
  Filter,
  X,
  Globe,
  User,
  ExternalLink,
  Award,
  FileCheck,
  Loader2,
} from 'lucide-react';
import { Student, Course } from '../../types';
import { apiFetch } from '../../lib/api';
import { registerStudentWithFirebaseAuth, deleteStudentFromFirebaseAuth } from '../../lib/firebase';
import { fsSubscribeStudents, fsSaveStudent, fsGenerateNextRollNumber, fsIsRollNumberTaken } from '../../lib/firestoreService';
import { StudentShareModal } from './StudentShareModal';
import { useToast } from '../../lib/ToastContext';

interface StudentRegistrationProps {
  courses: Course[];
  onRefresh?: () => void;
  initialStudentData?: {
    name?: string;
    phone?: string;
    email?: string;
    courseId?: string;
  } | null;
}

const DEFAULT_BATCH_TIMINGS = [
  '07:00 AM - 08:00 AM (Early Morning)',
  '09:00 AM - 11:00 AM (Regular Morning)',
  '11:30 AM - 01:30 PM (Midday Batch)',
  '02:00 PM - 04:00 PM (Afternoon Practical)',
  '05:00 PM - 07:00 PM (Evening Batch)',
  '07:00 PM - 09:00 PM (Night Professional)',
  '10:00 AM - 02:00 PM (Weekend Sat/Sun)',
];

const CAMPUS_NAME = 'Oritech Computer (Main Campus)';
const CAMPUS_ADDRESS = 'Sharma Complex, Beside Hotel Jyoti Mahal, Convent road, New Colony, Rayagada-765001, Odisha';
const CAMPUS_PHONE = '+91 9437235124';

export const StudentRegistration: React.FC<StudentRegistrationProps> = ({
  courses,
  onRefresh,
  initialStudentData,
}) => {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Active view: 'register' form or 'directory' list
  const [activeTab, setActiveTab] = useState<'register' | 'directory'>('register');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [customRollNumber, setCustomRollNumber] = useState('');
  const [autoRollNumber, setAutoRollNumber] = useState('ORI-2026-100');
  const [rollNumberError, setRollNumberError] = useState('');
  const [isCheckingRoll, setIsCheckingRoll] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses.length > 0 ? courses[0].id : '');
  const [batchTiming, setBatchTiming] = useState(DEFAULT_BATCH_TIMINGS[1]);
  const [joinedDate, setJoinedDate] = useState(new Date().toISOString().split('T')[0]);

  // Pre-fill if student data passed from Inquiry lead conversion
  useEffect(() => {
    if (initialStudentData) {
      setActiveTab('register');
      if (initialStudentData.name) setName(initialStudentData.name);
      if (initialStudentData.phone) setPhone(initialStudentData.phone);
      if (initialStudentData.email) setEmail(initialStudentData.email);
      if (initialStudentData.courseId) setSelectedCourseId(initialStudentData.courseId);
    }
  }, [initialStudentData]);

  // Share Modal State
  const [shareModalStudent, setShareModalStudent] = useState<Student | null>(null);
  const [shareModalPassword, setShareModalPassword] = useState<string | undefined>(undefined);

  // Delete Student Modal State
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<{
    id: string;
    name: string;
    rollNumber: string;
    email?: string;
    plainPassword?: string;
    phone?: string;
  } | null>(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editProfileLink, setEditProfileLink] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Completed' | 'Dropped'>('Active');
  const [editCertificateUrl, setEditCertificateUrl] = useState('');
  const [editCertificateNumber, setEditCertificateNumber] = useState('');
  const [editCertificateGrade, setEditCertificateGrade] = useState('A+ (Distinction)');
  const [editCertificateDate, setEditCertificateDate] = useState('');

  // Directory Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchStudents();
    fetchNextRollNumber();
    generatePassword();

    // Real-time Firestore live listener for students
    const unsub = fsSubscribeStudents((firestoreStudents) => {
      if (Array.isArray(firestoreStudents) && firestoreStudents.length > 0) {
        setStudents(firestoreStudents);
        // Refresh auto roll number calculation
        fetchNextRollNumber(firestoreStudents);
      }
    });

    return () => {
      try {
        unsub();
      } catch (_) {}
    };
  }, []);

  const fetchNextRollNumber = async (currentStudents?: Student[]) => {
    setIsCheckingRoll(true);
    try {
      // 1. Try server API first for synchronized uniqueness across all collections
      const res = await apiFetch<{ nextRollNumber: string; numericPart: number }>('/api/students/next-roll').catch(() => null);
      if (res && res.nextRollNumber) {
        setAutoRollNumber(res.nextRollNumber);
        return;
      }
      
      // 2. Fallback to client-side Firestore dataset scan starting from 100
      const list = currentStudents || students;
      const fallbackRoll = fsGenerateNextRollNumber(list);
      setAutoRollNumber(fallbackRoll || 'ORI-2026-100');
    } catch (e) {
      console.warn('Next roll calculation note:', e);
      const fallbackRoll = fsGenerateNextRollNumber(currentStudents || students);
      setAutoRollNumber(fallbackRoll || 'ORI-2026-100');
    } finally {
      setIsCheckingRoll(false);
    }
  };

  // Real-time custom roll number duplicate validation
  const validateCustomRollNumber = (candidate: string, studentList = students) => {
    const clean = candidate.trim();
    if (!clean) {
      setRollNumberError('');
      return true;
    }

    const isTaken = fsIsRollNumberTaken(clean, studentList);
    if (isTaken) {
      const existing = studentList.find((s) => {
        const sRoll = (s.rollNumber || '').trim().toUpperCase();
        return sRoll === clean.toUpperCase() || sRoll.replace(/\D/g, '') === clean.replace(/\D/g, '');
      });
      const holderName = existing ? ` (assigned to ${existing.name})` : '';
      setRollNumberError(`Roll Number "${clean}" already exists${holderName}. Roll numbers must be unique.`);
      return false;
    } else {
      setRollNumberError('');
      return true;
    }
  };

  const handleRefreshRollNumber = () => {
    setCustomRollNumber('');
    setRollNumberError('');
    fetchNextRollNumber();
  };

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Student[]>('/api/students');
      setStudents(data || []);
    } catch (err: any) {
      console.error('Failed to load students', err);
    } finally {
      setLoading(false);
    }
  };

  // Form Submission: Registers in Firebase Auth + Backend Database + Triggers Share Card
  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!name.trim()) {
      setActionError('Student full name is required.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setActionError('Valid 10-digit contact phone number is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setActionError('Valid student login email is required.');
      return;
    }
    if (!password.trim() || password.trim().length < 6) {
      setActionError('Password must be at least 6 characters long.');
      return;
    }
    if (!selectedCourseId) {
      setActionError('Please select a course for enrollment.');
      return;
    }

    // Determine and validate target roll number
    const targetRollNumber = customRollNumber.trim() ? customRollNumber.trim().toUpperCase() : autoRollNumber;
    
    if (customRollNumber.trim()) {
      const isValid = validateCustomRollNumber(customRollNumber.trim());
      if (!isValid) {
        setActionError(`Cannot register: Roll Number "${customRollNumber.trim()}" is already assigned to another student. Please use a unique roll number.`);
        return;
      }
    }

    setSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const chosenCourse = courses.find((c) => c.id === selectedCourseId);

    try {
      // 1. Register Student in Firebase Authentication with safety timeout
      const fbResult = await registerStudentWithFirebaseAuth(cleanEmail, cleanPass, name.trim());
      if (!fbResult.success) {
        console.warn('Firebase Auth note:', fbResult.error);
      }

      // 2. Register Student in Database / Backend
      const payload = {
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        profileLink: profileLink.trim() || undefined,
        avatar: profileLink.trim() || undefined,
        courseId: selectedCourseId,
        totalFee: chosenCourse ? chosenCourse.fee : 0,
        initialPayment: 0,
        batchTiming: batchTiming.trim(),
        customUsername: targetRollNumber,
        customPassword: cleanPass,
        joinedDate,
      };

      const response = await apiFetch<any>(
        '/api/students',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      const createdStudent: Student = response?.student || (response?.name ? response : null) || {
        ...payload,
        id: `std-${Date.now()}`,
        rollNumber: targetRollNumber,
        courseTitle: chosenCourse?.title || 'Computer Course',
        selectedCourseIds: [selectedCourseId],
        paidAmount: 0,
        dueAmount: chosenCourse ? chosenCourse.fee : 0,
        status: 'Active',
      };

      // Response from /api/students already persists the student to Firestore
      const studentName = createdStudent.name || payload.name || 'Student';
      const studentRoll = createdStudent.rollNumber || targetRollNumber || 'ORI-2026-100';

      setActionSuccess(`Student "${studentName}" (Roll No: ${studentRoll}) registered successfully!`);
      toast.studentCreated(studentName, studentRoll);

      // Refresh list and recalculate next roll number
      fetchStudents().catch(() => {});
      fetchNextRollNumber();
      if (onRefresh) onRefresh();

      // Open Share Credentials Modal with campus details & login credentials
      setShareModalStudent(createdStudent);
      setShareModalPassword(cleanPass);

      // Reset form fields
      setName('');
      setPhone('');
      setEmail('');
      setProfileLink('');
      setCustomRollNumber('');
      setRollNumberError('');
      generatePassword();
    } catch (err: any) {
      setActionError(err.message || 'Failed to register student.');
      toast.error('Student Registration Failed', err.message || 'Could not create student account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditPhone(student.phone);
    setEditEmail(student.email);
    setEditProfileLink(student.profileLink || student.avatar || '');
    setEditBatch(student.batchTiming);
    setEditStatus(student.status);
    setEditCertificateUrl(student.certificateUrl || '');
    setEditCertificateNumber(student.certificateNumber || `CERT-2026-${student.rollNumber.replace(/\D/g, '') || '101'}`);
    setEditCertificateGrade(student.certificateGrade || 'A+ (Distinction)');
    setEditCertificateDate(student.certificateIssueDate || new Date().toISOString().split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const isCertificateEntered = Boolean(editCertificateUrl.trim());
      const effectiveStatus = isCertificateEntered || editStatus === 'Completed' ? 'Completed' : editStatus;

      const payload: any = {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim().toLowerCase(),
        profileLink: editProfileLink.trim() || undefined,
        avatar: editProfileLink.trim() || undefined,
        batchTiming: editBatch.trim(),
        status: effectiveStatus,
      };

      if (effectiveStatus === 'Completed' || isCertificateEntered) {
        payload.certificateUrl = editCertificateUrl.trim() || undefined;
        payload.certificateNumber = editCertificateNumber.trim().toUpperCase() || undefined;
        payload.certificateGrade = editCertificateGrade.trim() || 'A+ (Distinction)';
        payload.certificateIssueDate = editCertificateDate.trim() || new Date().toISOString().split('T')[0];
      }

      const updated = await apiFetch<Student>(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setActionSuccess(`Updated details for ${updated.name}.`);
      toast.studentUpdated(updated.name, updated.rollNumber);
      setIsEditModalOpen(false);
      await fetchStudents();
      if (onRefresh) onRefresh();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update student.');
      toast.error('Student Update Failed', err.message || 'Could not update student records.');
    }
  };

  const handleConfirmDeleteStudent = async () => {
    if (!deleteStudentTarget) return;

    const target = deleteStudentTarget;
    // Close modal immediately so UI is responsive
    setDeleteStudentTarget(null);
    setIsDeletingStudent(false);

    // 1. Optimistic instant local removal from directory list
    setStudents((prev) => prev.filter((s) => s.id !== target.id));

    // 2. Play immediate removal animation feedback
    toast.studentDeleted(target.name, target.rollNumber);
    setActionSuccess(`Student "${target.name}" (${target.rollNumber}) deleted from directory.`);

    try {
      // 3. Delete student and user login from backend database
      await apiFetch(`/api/students/${target.id}`, { method: 'DELETE' });

      // 4. Background purge of credentials from Firebase Authentication & Firestore
      if (target.email || target.rollNumber) {
        deleteStudentFromFirebaseAuth(
          target.email,
          target.plainPassword,
          target.rollNumber,
          target.phone
        ).catch((fbErr) => {
          console.warn('Firebase student removal background note:', fbErr);
        });
      }

      // 5. Refresh student lists and parent state in background
      await fetchStudents();
      if (onRefresh) onRefresh();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Delete student error:', err);
      setActionError(err.message || 'Failed to delete student.');
      toast.error('Delete Student Failed', err.message || 'Could not delete student record.');
      await fetchStudents();
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Filter students list
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm) ||
      (s.courseTitle && s.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCourse = filterCourse === 'All' || s.courseId === filterCourse;
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-red-700 hover:text-red-950 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>New Student Registration</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Directory & Records ({students.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: REGISTRATION FORM */}
      {activeTab === 'register' && (
        <div className="w-full max-w-5xl mx-auto">
          {/* Main Registration Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="pb-5 border-b border-slate-100 mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  <span>Student Admission & Account Form</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Registers profile, assigns course batch, and generates Firebase Authentication login.
                </p>
              </div>

              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto Firebase Sync</span>
              </span>
            </div>

            <form onSubmit={handleRegisterStudent} className="space-y-6">
              {/* SECTION 1: PERSONAL DETAILS */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>1. Student Profile Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9437235124"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Student Roll Number *
                      </label>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>Starts from 100 • Unique</span>
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={customRollNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomRollNumber(val);
                          validateCustomRollNumber(val);
                        }}
                        placeholder={`Auto: ${autoRollNumber || 'ORI-2026-100'}`}
                        className={`w-full bg-slate-50 border rounded-xl p-3 pr-10 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white transition-all ${
                          rollNumberError
                            ? 'border-rose-500 bg-rose-50/40 text-rose-900 focus:border-rose-600'
                            : customRollNumber.trim()
                            ? 'border-emerald-400 bg-emerald-50/20 text-emerald-900 focus:border-emerald-600'
                            : 'border-slate-300 focus:border-indigo-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleRefreshRollNumber}
                        title="Refresh & Recalculate Next Guaranteed Unique Roll Number"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${isCheckingRoll ? 'animate-spin text-indigo-600' : ''}`} />
                      </button>
                    </div>

                    {/* Real-time Status Badge & Description */}
                    {(rollNumberError || customRollNumber.trim()) && (
                      <div className="mt-1.5 min-h-[18px]">
                        {rollNumberError ? (
                          <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                            <span>{rollNumberError}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                            <span>Roll number is unique & verified available</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Profile Image Link Field */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Profile Image Link / Photo URL (Optional)
                      </label>
                      <span className="text-[11px] font-medium text-slate-500">
                        Direct image link (JPG, PNG, WebP)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          value={profileLink}
                          onChange={(e) => setProfileLink(e.target.value)}
                          placeholder="https://images.unsplash.com/... or https://..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                        />
                      </div>
                      {profileLink && (
                        <div className="w-12 h-12 rounded-xl border-2 border-indigo-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center shadow-xs">
                          <img
                            src={profileLink}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Displays student avatar in the directory, student portal dashboard, ID card, and results.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: COURSE & BATCH ENROLLMENT */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>2. Course & Batch Enrollment</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Course *
                    </label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.code}) - {c.duration}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Batch Timing *
                    </label>
                    <select
                      value={batchTiming}
                      onChange={(e) => setBatchTiming(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                    >
                      {DEFAULT_BATCH_TIMINGS.map((timing) => (
                        <option key={timing} value={timing}>
                          {timing}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admission Date
                    </label>
                    <input
                      type="date"
                      value={joinedDate}
                      onChange={(e) => setJoinedDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: LOGIN CREDENTIALS & FIREBASE AUTH */}
              <div className="space-y-4 pt-2 border-t border-slate-100 p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>3. Student Portal Login Credentials (Email & Password)</span>
                  </h3>
                  <span className="text-[10px] font-extrabold text-indigo-700 uppercase bg-indigo-100 px-2 py-0.5 rounded-md">
                    Student Login
                  </span>
                </div>
                <p className="text-xs text-indigo-800 font-medium">
                  The student will log in to the website portal with this email and password to access course videos, notes, and exams.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-indigo-950 mb-1">
                      Student Login Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full bg-white border border-indigo-200 rounded-xl pl-9 pr-3 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-indigo-950">
                        Student Login Password *
                      </label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    </div>

                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl pl-9 pr-10 py-3 text-sm font-mono font-bold text-indigo-900 focus:outline-none focus:border-indigo-600 tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-end gap-4">
                <button
                  type="submit"
                  disabled={submitting || Boolean(rollNumberError)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-black transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Student & Syncing Auth...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Register Student & Get Share Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: STUDENT DIRECTORY & RECORDS */}
      {activeTab === 'directory' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, roll number, email, or phone..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="All">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Dropped">Dropped</option>
              </select>
            </div>
          </div>

          {/* Students Records Table */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-600">Loading student directory...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No student records found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchTerm || filterCourse !== 'All'
                  ? 'Try changing your search keywords or filters.'
                  : 'Enroll your first student using the "New Student Registration" tab.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-5 py-4">Student & ID</th>
                      <th className="px-4 py-4">Contact & Login Email</th>
                      <th className="px-4 py-4">Course & Batch</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions & Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Student Name & Roll */}
                        <td className="px-5 py-4">
                          <div className="font-black text-slate-900 text-sm">{s.name}</div>
                          <div className="font-mono text-indigo-700 font-bold text-[11px] mt-0.5">
                            {s.rollNumber}
                          </div>
                        </td>

                        {/* Contact & Email */}
                        <td className="px-4 py-4 space-y-0.5">
                          <div className="text-slate-800 font-semibold truncate max-w-[200px] flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{s.email}</span>
                          </div>
                          <div className="text-slate-500 font-mono flex items-center gap-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{s.phone}</span>
                          </div>
                        </td>

                        {/* Course & Timing */}
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900 truncate max-w-[180px]">
                            {s.courseTitle || 'Enrolled Course'}
                          </div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{s.batchTiming || 'Morning Batch'}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                s.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : s.status === 'Completed'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {s.status}
                            </span>
                            {s.certificateUrl && (
                              <div className="flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5 w-fit">
                                <Award className="w-3 h-3" />
                                <span>Certificate Issued</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Student Profile Button */}
                            <a
                              href={`/student?roll=${encodeURIComponent(s.rollNumber)}`}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs border border-amber-200/70"
                              title={`View ${s.name}'s Student Profile Portal`}
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                              <span>Profile</span>
                            </a>

                            {/* Share Credentials Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setShareModalStudent(s);
                                setShareModalPassword(s.plainPassword || 'student123');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Share Credentials & Campus Details"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(s)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Edit Student Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteStudentTarget({
                                  id: s.id,
                                  name: s.name,
                                  rollNumber: s.rollNumber,
                                  email: s.email,
                                  plainPassword: s.plainPassword,
                                  phone: s.phone,
                                })
                              }
                              className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SHARE CREDENTIALS MODAL */}
      {shareModalStudent && (
        <StudentShareModal
          student={shareModalStudent}
          plainPassword={shareModalPassword}
          course={courses.find((c) => c.id === shareModalStudent.courseId)}
          campusName={CAMPUS_NAME}
          campusAddress={CAMPUS_ADDRESS}
          campusPhone={CAMPUS_PHONE}
          onClose={() => {
            setShareModalStudent(null);
            setShareModalPassword(undefined);
          }}
        />
      )}

      {/* EDIT STUDENT MODAL */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Edit Student Profile</h3>
                <p className="text-xs text-slate-400 mt-0.5">{editingStudent.rollNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Profile Link / Photo URL</label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={editProfileLink}
                    onChange={(e) => setEditProfileLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Login Email *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch Timing</label>
                <input
                  type="text"
                  value={editBatch}
                  onChange={(e) => setEditBatch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900"
                />
              </div>

              {/* CERTIFICATE FILE LINK SECTION (APPEARS ONLY WHEN STATUS IS 'Completed') */}
              {editStatus === 'Completed' && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300/80 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-amber-950 uppercase tracking-wider">
                        Official Certificate File Link & Verification
                      </div>
                      <div className="text-[11px] text-amber-800">
                        Unlocked! Visible in student's dashboard for download & publicly verifiable by Roll Number.
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-950 mb-1">
                      Certificate File Link / Image URL *
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" />
                      <input
                        type="url"
                        value={editCertificateUrl}
                        onChange={(e) => setEditCertificateUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... or Google Drive / Cloud URL"
                        className="w-full bg-white border border-amber-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Certificate Number
                      </label>
                      <input
                        type="text"
                        value={editCertificateNumber}
                        onChange={(e) => setEditCertificateNumber(e.target.value)}
                        placeholder="e.g. CERT-2026-101"
                        className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Grade / Distinction
                      </label>
                      <select
                        value={editCertificateGrade}
                        onChange={(e) => setEditCertificateGrade(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-bold text-slate-900"
                      >
                        <option value="A+ (Distinction)">A+ (Distinction)</option>
                        <option value="A (First Class)">A (First Class)</option>
                        <option value="B+ (Higher Second)">B+ (Higher Second)</option>
                        <option value="B (Second Class)">B (Second Class)</option>
                        <option value="Pass">Pass</option>
                      </select>
                    </div>
                  </div>

                  {editCertificateUrl && (
                    <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate text-xs text-amber-900">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{editCertificateUrl}</span>
                      </div>
                      <a
                        href={editCertificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold shrink-0 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Test Link</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE STUDENT CONFIRMATION MODAL */}
      {deleteStudentTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Delete Student Account?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">{deleteStudentTarget.name}</strong>{' '}
              (<span className="font-mono font-bold text-slate-800">{deleteStudentTarget.rollNumber}</span>)?
            </p>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-medium space-y-1.5 mb-5">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Direct Firebase Authentication & Records Removal</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                This will immediately purge the student profile from the institute directory and permanently revoke their Firebase Authentication account credentials.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingStudent}
                onClick={() => setDeleteStudentTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingStudent}
                onClick={handleConfirmDeleteStudent}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isDeletingStudent ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Student & Auth</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
