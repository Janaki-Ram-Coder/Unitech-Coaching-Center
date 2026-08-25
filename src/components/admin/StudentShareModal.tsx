import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Mail,
  ExternalLink,
  ShieldCheck,
  User,
  BookOpen,
  MapPin,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Sparkles,
  Printer,
} from 'lucide-react';
import { Student, Course } from '../../types';

export interface StudentShareModalProps {
  student: Student;
  plainPassword?: string;
  course?: Course | null;
  campusName?: string;
  campusAddress?: string;
  campusPhone?: string;
  onClose: () => void;
}

export const StudentShareModal: React.FC<StudentShareModalProps> = ({
  student,
  plainPassword,
  course,
  campusName = 'Oritech Computer (Main Campus)',
  campusAddress = 'Sharma Complex, Beside Hotel Jyoti Mahal, Convent road, New Colony, Rayagada-765001, Odisha',
  campusPhone = '+91 9437235124',
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(true);

  const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://oritech.edu/login';
  const effectivePassword = plainPassword || student.plainPassword || 'student123';

  // Construct structured share message
  const shareMessage = `🎓 *ORITECH COMPUTER - STUDENT ADMISSION & LOGIN DETAILS* 🎓
------------------------------------------
👤 *Student Name:* ${student.name}
🆔 *Roll Number / Student ID:* ${student.rollNumber}
📚 *Enrolled Course:* ${student.courseTitle || course?.title || 'Certified Course'}
⏰ *Batch Timing:* ${student.batchTiming || '09:00 AM - 11:00 AM'}
📍 *Campus:* ${campusName}
🏢 *Address:* ${campusAddress}
📞 *Helpline:* ${campusPhone}
------------------------------------------
🔐 *PORTAL LOGIN CREDENTIALS:*
🌐 *Login Portal:* ${loginUrl}
📧 *Email / Username:* ${student.email || student.rollNumber}
🔑 *Password:* ${effectivePassword}
------------------------------------------
👉 Please keep your login credentials secure. Log in to access course videos, study notes, and assignments.`;

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleCopyField = async (field: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(shareMessage);
    const phoneParam = student.phone ? `&phone=${encodeURIComponent(student.phone.replace(/\D/g, ''))}` : '';
    window.open(`https://api.whatsapp.com/send?text=${encoded}${phoneParam}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Welcome to Oritech Computer - Your Student Portal Login Credentials (${student.name})`);
    const body = encodeURIComponent(shareMessage);
    window.open(`mailto:${student.email || ''}?subject=${subject}&body=${body}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 px-6 sm:px-8 py-6 text-white relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-5 right-5 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold w-fit mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Registration Confirmed</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Student Admission & Login Details
          </h2>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1">
            Share these login credentials and campus details directly with the student.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Student & Course Summary Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Student Name</span>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>{student.name}</span>
                </h3>
              </div>
              <div className="sm:text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Roll Number / ID</span>
                <p className="font-mono text-base font-extrabold text-indigo-700">{student.rollNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Enrolled Course</span>
                <p className="text-slate-900 font-bold text-sm mt-0.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{student.courseTitle || course?.title || 'Selected Course'}</span>
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Batch Timing</span>
                <p className="text-slate-900 font-bold text-sm mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{student.batchTiming || '09:00 AM - 11:00 AM'}</span>
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Campus Location</span>
                <p className="text-slate-900 font-bold text-xs mt-0.5 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{campusName} - {campusAddress}</span>
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Fee Summary</span>
                <p className="text-slate-900 font-bold text-xs mt-0.5">
                  Total: <span className="text-slate-900 font-mono">₹{student.totalFee.toLocaleString()}</span> | Paid:{' '}
                  <span className="text-emerald-700 font-mono">₹{student.paidAmount.toLocaleString()}</span> | Due:{' '}
                  <span className="text-rose-700 font-mono">₹{student.dueAmount.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Student Login Credentials Box */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Portal Login Credentials</span>
              </h4>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                Firebase Auth Synced
              </span>
            </div>

            {/* Email Field */}
            <div className="bg-white border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Student Login Email
                </span>
                <p className="text-sm font-bold font-mono text-slate-900 truncate">
                  {student.email || student.rollNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyField('email', student.email || student.rollNumber)}
                className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer shrink-0"
                title="Copy Email"
              >
                {copiedField === 'email' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password Field */}
            <div className="bg-white border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Student Login Password
                </span>
                <p className="text-sm font-bold font-mono text-indigo-900 tracking-wider">
                  {showPassword ? effectivePassword : '••••••••••••'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyField('password', effectivePassword)}
                  className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                  title="Copy Password"
                >
                  {copiedField === 'password' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Link Field */}
            <div className="bg-white border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Login Page Link
                </span>
                <a
                  href={loginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline truncate block"
                >
                  {loginUrl}
                </a>
              </div>
              <button
                type="button"
                onClick={() => handleCopyField('url', loginUrl)}
                className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer shrink-0"
                title="Copy Login URL"
              >
                {copiedField === 'url' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Sharing Action Buttons */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Instant Share Options
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share WhatsApp</span>
              </button>

              {/* Email Share Button */}
              <button
                type="button"
                onClick={handleShareEmail}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Mail className="w-4 h-4" />
                <span>Share Email</span>
              </button>

              {/* Copy All Details Button */}
              <button
                type="button"
                onClick={handleCopyAll}
                className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Full Details'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Memo</span>
            </button>

            <a
              href={`/student?roll=${encodeURIComponent(student.rollNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-amber-700" />
              <span>View Portal</span>
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
