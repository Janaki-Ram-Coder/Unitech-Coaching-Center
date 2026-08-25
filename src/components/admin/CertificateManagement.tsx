import React, { useState, useEffect } from 'react';
import {
  Award,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  User,
  Eye,
  X,
  Sparkles,
  AlertCircle,
  Image,
  Phone,
  Mail,
  Check,
} from 'lucide-react';
import { CertificateRecord, Student, Course } from '../../types';
import { apiFetch } from '../../lib/api';
import {
  fsUpdateStudent,
  fsSubscribeCertificates,
  fsGetCertificates,
  fsSaveCertificate,
  fsUpdateCertificate,
  fsDeleteCertificate,
} from '../../lib/firestoreService';
import { useToast } from '../../lib/ToastContext';

interface CertificateManagementProps {
  students: Student[];
  courses: Course[];
  onRefresh?: () => void;
}

export const CertificateManagement: React.FC<CertificateManagementProps> = ({
  students,
  courses,
  onRefresh,
}) => {
  const toast = useToast();
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'directory'>('upload');

  // Student Search in Upload Form
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [grade, setGrade] = useState('A+ (Distinction)');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Feedback State
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Preview & Edit Modal
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);
  const [editingCert, setEditingCert] = useState<CertificateRecord | null>(null);
  const [editCertUrl, setEditCertUrl] = useState('');
  const [editCertGrade, setEditCertGrade] = useState('');
  const [editCertDate, setEditCertDate] = useState('');
  const [editCertNum, setEditCertNum] = useState('');
  const [editCertRemarks, setEditCertRemarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<CertificateRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const fsCerts = await fsGetCertificates();
      if (fsCerts && fsCerts.length > 0) {
        setCertificates(fsCerts);
      } else {
        const data = await apiFetch<CertificateRecord[]>('/api/certificates').catch(() => []);
        setCertificates(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
    const unsubscribe = fsSubscribeCertificates((liveCerts) => {
      setCertificates(liveCerts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Search filtered students based on name, roll no, mobile, email
  const searchedStudents = students.filter((s) => {
    if (!studentSearchQuery.trim()) return true;
    const q = studentSearchQuery.toLowerCase().trim();
    const nameMatch = (s.name || '').toLowerCase().includes(q);
    const rollMatch = (s.rollNumber || '').toLowerCase().includes(q);
    const phoneMatch = (s.phone || '').toLowerCase().includes(q);
    const emailMatch = (s.email || '').toLowerCase().includes(q);
    const courseMatch = (s.courseTitle || '').toLowerCase().includes(q);
    return nameMatch || rollMatch || phoneMatch || emailMatch || courseMatch;
  });

  // When a student is selected, autofill details
  const handleSelectStudentObj = (matched: Student) => {
    setSelectedStudentId(matched.id);
    setStudentSearchQuery(`${matched.name} (${matched.rollNumber})`);
    setIsSearchDropdownOpen(false);

    setRollNumber(matched.rollNumber);
    setStudentName(matched.name);
    setCourseTitle(matched.courseTitle || 'Computer Diploma Course');
    setCourseId(matched.courseId);
    const cleanNum = matched.rollNumber.replace(/\D/g, '') || Math.floor(100 + Math.random() * 900);
    setCertificateNumber(`CERT-2026-${cleanNum}`);
    if (matched.certificateUrl) {
      setCertificateUrl(matched.certificateUrl);
    }
    if (matched.certificateGrade) {
      setGrade(matched.certificateGrade);
    }
    if (matched.certificateIssueDate) {
      setIssueDate(matched.certificateIssueDate);
    }
  };

  const handleClearSelectedStudent = () => {
    setSelectedStudentId('');
    setStudentSearchQuery('');
    setRollNumber('');
    setStudentName('');
    setCourseTitle('');
    setCourseId('');
    setCertificateNumber('');
    setCertificateUrl('');
    setRemarks('');
  };

  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim() || !certificateUrl.trim()) {
      setActionError('Please provide student Roll Number and Certificate URL.');
      return;
    }

    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const cleanRoll = rollNumber.trim().toUpperCase();
      const certNum = certificateNumber.trim() || `CERT-2026-${cleanRoll.replace(/\D/g, '') || '101'}`;
      const certId = `cert-${Date.now()}`;

      const newCertRecord: CertificateRecord = {
        id: certId,
        rollNumber: cleanRoll,
        studentName: studentName.trim(),
        courseTitle: courseTitle.trim(),
        courseId: courseId || undefined,
        certificateNumber: certNum,
        issueDate,
        grade,
        certificateUrl: certificateUrl.trim(),
        status: 'Verified',
        remarks: remarks.trim() || 'Official Institute Certification & Practical Course Completion',
        createdAt: issueDate,
      };

      // 1. Direct Firestore write into 'certificates' collection
      try {
        await fsSaveCertificate(newCertRecord);
      } catch (fsErr) {
        console.warn('Firestore direct certificate write warning:', fsErr);
      }

      // 2. Also notify backend API (with fallback if offline)
      try {
        await apiFetch<{ success: boolean; certificate: CertificateRecord; message: string }>(
          '/api/certificates',
          {
            method: 'POST',
            body: JSON.stringify(newCertRecord),
          }
        );
      } catch (apiErr) {
        console.warn('Backend API certificate write warning:', apiErr);
      }

      // Direct Firestore student status update for instantaneous reactivity
      const matchedStudent = students.find(
        (s) => (s.rollNumber && s.rollNumber.trim().toUpperCase() === cleanRoll) || (selectedStudentId && s.id === selectedStudentId)
      );
      if (matchedStudent) {
        try {
          await fsUpdateStudent(matchedStudent.id, {
            status: 'Completed',
            certificateUrl: certificateUrl.trim(),
            certificateNumber: certNum,
            certificateIssueDate: issueDate,
            certificateGrade: grade,
          });
        } catch (e) {
          console.warn('Optimistic student update warning:', e);
        }
      }

      setActionSuccess(`Certificate successfully issued and published for ${studentName || cleanRoll}! Student status converted to Completed.`);
      toast.certificateUploaded(studentName || cleanRoll, certNum);
      
      // Reset form
      handleClearSelectedStudent();

      await fetchCertificates();
      if (onRefresh) onRefresh();

      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to issue certificate.');
      toast.error('Certificate Issuance Failed', err.message || 'Could not save certificate.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (cert: CertificateRecord) => {
    setEditingCert(cert);
    setEditCertUrl(cert.certificateUrl);
    setEditCertGrade(cert.grade || 'A+ (Distinction)');
    setEditCertDate(cert.issueDate || new Date().toISOString().split('T')[0]);
    setEditCertNum(cert.certificateNumber);
    setEditCertRemarks(cert.remarks || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;

    setIsUpdating(true);
    try {
      const updatedData: Partial<CertificateRecord> = {
        certificateUrl: editCertUrl.trim(),
        grade: editCertGrade.trim(),
        issueDate: editCertDate.trim(),
        certificateNumber: editCertNum.trim(),
        remarks: editCertRemarks.trim(),
      };

      // 1. Direct Firestore update in 'certificates' collection
      try {
        await fsUpdateCertificate(editingCert.id, updatedData);
      } catch (fsErr) {
        console.warn('Firestore certificate update warning:', fsErr);
      }

      // 2. Also notify backend API
      try {
        await apiFetch(`/api/certificates/${editingCert.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatedData),
        });
      } catch (apiErr) {
        console.warn('Backend API certificate update warning:', apiErr);
      }

      // Update matching student in Firestore
      const cleanRoll = (editingCert.rollNumber || '').trim().toUpperCase();
      const matchedStudent = students.find((s) => (s.rollNumber || '').trim().toUpperCase() === cleanRoll);
      if (matchedStudent) {
        try {
          await fsUpdateStudent(matchedStudent.id, {
            status: 'Completed',
            certificateUrl: editCertUrl.trim(),
            certificateNumber: editCertNum.trim(),
            certificateIssueDate: editCertDate.trim(),
            certificateGrade: editCertGrade.trim(),
          });
        } catch (e) {
          console.warn('Optimistic student update warning:', e);
        }
      }

      setActionSuccess(`Updated certificate for ${editingCert.studentName}.`);
      toast.success('Certificate Updated', 'Certificate record details updated.', editingCert.studentName);
      setEditingCert(null);
      await fetchCertificates();
      if (onRefresh) onRefresh();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update certificate.');
      toast.error('Certificate Update Failed', err.message || 'Could not update certificate.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      // 1. Direct Firestore delete from 'certificates' collection
      try {
        await fsDeleteCertificate(deleteTarget.id);
      } catch (fsErr) {
        console.warn('Firestore certificate delete warning:', fsErr);
      }

      // 2. Also notify backend API
      try {
        await apiFetch(`/api/certificates/${deleteTarget.id}`, {
          method: 'DELETE',
        });
      } catch (apiErr) {
        console.warn('Backend API certificate delete warning:', apiErr);
      }

      // Revert student status if matching
      const cleanRoll = (deleteTarget.rollNumber || '').trim().toUpperCase();
      const matchedStudent = students.find((s) => (s.rollNumber || '').trim().toUpperCase() === cleanRoll);
      if (matchedStudent) {
        try {
          await fsUpdateStudent(matchedStudent.id, {
            status: 'Active',
            certificateUrl: undefined,
            certificateNumber: undefined,
          });
        } catch (e) {
          console.warn('Optimistic student revert warning:', e);
        }
      }

      setActionSuccess(`Certificate ${deleteTarget.certificateNumber} removed.`);
      toast.certificateDeleted(deleteTarget.studentName || deleteTarget.certificateNumber);
      setDeleteTarget(null);
      await fetchCertificates();
      if (onRefresh) onRefresh();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete certificate.');
      toast.error('Delete Certificate Failed', err.message || 'Could not delete certificate.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Certificates for directory tab
  const filteredCertificates = certificates.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.rollNumber.toLowerCase().includes(q) ||
      c.studentName.toLowerCase().includes(q) ||
      c.certificateNumber.toLowerCase().includes(q) ||
      (c.courseTitle && c.courseTitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Certification & Credential Uploader
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Issue student certificates, update course completion status, and manage verified records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'upload'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Certificate</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'directory'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified List ({certificates.length})</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="p-1 text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="p-1 text-rose-700 hover:text-rose-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SUB-TAB 1: UPLOAD CERTIFICATE FORM */}
      {activeSubTab === 'upload' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Issue Official Student Certificate
                </h3>
                <p className="text-xs text-slate-500">
                  Search student by Name, Roll No, Mobile, or Email to autofill details. Submitting sets student status to <span className="font-bold text-emerald-700">Completed</span>.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Certificate Upload
              </span>
            </div>

            <form onSubmit={handleCreateCertificate} className="space-y-5">
              {/* Search Bar Section in place of select dropdown */}
              <div className="relative space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Search Enrolled Student (By Name, Roll No, Mobile No, or Email)
                </label>
                
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    onChange={(e) => {
                      setStudentSearchQuery(e.target.value);
                      setIsSearchDropdownOpen(true);
                    }}
                    placeholder="Type Name, Roll Number (e.g. ORI-2026-101), Mobile number, or Email..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-10 py-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                  {studentSearchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSelectedStudent}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete / Search Results Dropdown */}
                {isSearchDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsSearchDropdownOpen(false)}
                    />
                    <div className="absolute top-full inset-x-0 mt-1.5 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {searchedStudents.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No matching student found for "{studentSearchQuery}".
                        </div>
                      ) : (
                        searchedStudents.map((s) => {
                          const isSelected = selectedStudentId === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSelectStudentObj(s)}
                              className={`w-full text-left p-3 hover:bg-amber-50/70 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                                isSelected ? 'bg-amber-50 font-bold' : ''
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs truncate">
                                    {s.name}
                                  </span>
                                  <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                                    {s.rollNumber}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                                    s.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {s.status}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                                  <span className="truncate">{s.courseTitle || 'Course'}</span>
                                  {s.phone && (
                                    <span className="inline-flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {s.phone}
                                    </span>
                                  )}
                                  {s.email && (
                                    <span className="inline-flex items-center gap-1 truncate max-w-[150px]">
                                      <Mail className="w-3 h-3 text-slate-400" />
                                      {s.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Roll Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Student Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ORI-2026-101"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* Certificate Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Certificate Registration / Serial No.
                  </label>
                  <input
                    type="text"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. CERT-2026-101"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* Course Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Python Full Stack & AI Development"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Issue Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Issue Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Grade / Distinction */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Grade / Award Level
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="A+ (Distinction)">A+ (Distinction)</option>
                    <option value="A (First Class)">A (First Class)</option>
                    <option value="B+ (Higher Second)">B+ (Higher Second)</option>
                    <option value="B (Second Class)">B (Second Class)</option>
                    <option value="Pass">Pass</option>
                  </select>
                </div>
              </div>

              {/* Certificate URL / Link (Without quick presets) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Certificate File Link / Hosted Image URL *
                </label>
                <div className="relative">
                  <Image className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    required
                    value={certificateUrl}
                    onChange={(e) => setCertificateUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or hosted image/pdf link (.jpg, .png, .webp)"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Direct image links (.jpg, .png, .webp) or high-resolution document URLs.
                </p>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Remarks / Special Honors (Optional)
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Completed with 94% marks and distinguished project capstone"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing Certificate...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Issue & Publish Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DIRECTORY OF ISSUED CERTIFICATES */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, roll number, certificate number, or course..."
              className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 outline-hidden font-medium"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-600">Loading certificate registry...</p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No certificates found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchTerm
                  ? 'No certificate matches your search keywords.'
                  : 'Issue your first certificate using the "Upload Certificate" tab above.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-5 py-4">Student & Roll No.</th>
                      <th className="px-4 py-4">Certificate Serial</th>
                      <th className="px-4 py-4">Course</th>
                      <th className="px-4 py-4">Issue Date & Grade</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredCertificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Student Name */}
                        <td className="px-5 py-4">
                          <div className="font-black text-slate-900 text-sm">{cert.studentName}</div>
                          <div className="font-mono text-amber-700 font-bold text-[11px] mt-0.5">
                            {cert.rollNumber}
                          </div>
                        </td>

                        {/* Certificate Serial */}
                        <td className="px-4 py-4 font-mono font-bold text-slate-800">
                          {cert.certificateNumber}
                        </td>

                        {/* Course */}
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900 truncate max-w-[200px]">
                            {cert.courseTitle}
                          </div>
                        </td>

                        {/* Date & Grade */}
                        <td className="px-4 py-4">
                          <div className="text-slate-800 font-bold">{cert.grade || 'A+ (Distinction)'}</div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{cert.issueDate}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview */}
                            <button
                              type="button"
                              onClick={() => setPreviewCert(cert)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Preview Certificate"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Preview</span>
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cert)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Edit Certificate"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(cert)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="Delete Certificate"
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

      {/* PREVIEW CERTIFICATE MODAL */}
      {previewCert && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={() => setPreviewCert(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-black text-slate-900">{previewCert.studentName}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {previewCert.rollNumber} • {previewCert.certificateNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewCert(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner flex items-center justify-center">
              <img
                src={previewCert.certificateUrl}
                alt={previewCert.studentName}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Course</span>
                <span className="font-bold text-slate-800 truncate block">{previewCert.courseTitle}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Grade</span>
                <span className="font-bold text-emerald-700 block">{previewCert.grade || 'A+'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Issued On</span>
                <span className="font-bold text-slate-800 block">{previewCert.issueDate}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Status</span>
                <span className="font-bold text-blue-700 block">Verified Active</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CERTIFICATE MODAL */}
      {editingCert && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setEditingCert(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Edit Certificate</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editingCert.rollNumber} - {editingCert.studentName}
                </p>
              </div>
              <button
                onClick={() => setEditingCert(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Certificate File Link / Image URL
                </label>
                <input
                  type="url"
                  required
                  value={editCertUrl}
                  onChange={(e) => setEditCertUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Certificate Number
                  </label>
                  <input
                    type="text"
                    value={editCertNum}
                    onChange={(e) => setEditCertNum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grade / Award
                  </label>
                  <select
                    value={editCertGrade}
                    onChange={(e) => setEditCertGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                  >
                    <option value="A+ (Distinction)">A+ (Distinction)</option>
                    <option value="A (First Class)">A (First Class)</option>
                    <option value="B+ (Higher Second)">B+ (Higher Second)</option>
                    <option value="B (Second Class)">B (Second Class)</option>
                    <option value="Pass">Pass</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={editCertDate}
                  onChange={(e) => setEditCertDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={editCertRemarks}
                  onChange={(e) => setEditCertRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Revoke Certificate?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove the certificate for{' '}
                <span className="font-bold text-slate-800">{deleteTarget.studentName}</span> (
                {deleteTarget.rollNumber})? It will no longer be verifiable on the public portal.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Revoking...' : 'Confirm Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
