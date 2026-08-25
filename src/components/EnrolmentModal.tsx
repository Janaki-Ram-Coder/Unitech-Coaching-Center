import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Course } from '../types';
import { apiFetch } from '../lib/api';
import { useToast } from '../lib/ToastContext';

interface EnrolmentModalProps {
  course: Course | null;
  courses: Course[];
  onClose: () => void;
}

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  courseId?: string;
}

export const EnrolmentModal: React.FC<EnrolmentModalProps> = ({ course, courses, onClose }) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(course?.id || (courses[0]?.id || ''));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    // Lock background scroll when modal opens
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate Name
    if (!name.trim()) {
      errors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    // Validate Phone
    const digits = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (digits.length < 10) {
      errors.phone = 'Please enter a valid phone number (at least 10 digits).';
    }

    // Validate Email format if entered
    if (email.trim() && !emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. user@example.com).';
    }

    // Validate Course selection
    if (!selectedCourseId) {
      errors.courseId = 'Please select a course.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      setError('Please fix the errors in the form before submitting.');
      return;
    }

    setLoading(true);

    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          courseId: selectedCourseId,
          message: message.trim(),
        }),
      });
      setSubmitted(true);

      const targetCourse = courses.find((c) => c.id === selectedCourseId) || course;
      const courseTitle = targetCourse?.title || 'Course';

      toast.enrollmentSubmitted(name.trim(), courseTitle, phone.trim());
    } catch (err: any) {
      const errMsg = err.message || 'Failed to submit enquiry. Please try again.';
      setError(errMsg);
      toast.error('Enrollment Submission Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-3 sm:p-6 transition-all duration-300 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-center justify-center p-0 sm:p-2 text-center">
        <div className="relative w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-2xl flex flex-col text-left overflow-hidden my-auto transform transition-all">
          {/* Modal Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-blue-950">Course Enquiry & Enrollment</h3>
              <p className="text-xs text-slate-600 font-medium">Fill in your details for batch counseling and fee discounts.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4 focus:outline-none">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Enquiry Received!</h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto font-medium">
                Thank you <span className="text-blue-900 font-extrabold">{name}</span> for your interest in Oritech Computer. Our counselor will contact you at <span className="font-mono text-indigo-600 font-bold">{phone}</span> shortly with batch details.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-blue-950 mb-1">FULL NAME *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                  }}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full bg-slate-50 border rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none font-medium transition-colors ${
                    fieldErrors.name
                      ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                      : 'border-slate-300 focus:border-indigo-600'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-[11px] font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-blue-950 mb-1">PHONE NUMBER *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: undefined });
                    }}
                    placeholder="e.g. 9437235124"
                    className={`w-full bg-slate-50 border rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none font-mono font-bold transition-colors ${
                      fieldErrors.phone
                        ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                        : 'border-slate-300 focus:border-indigo-600'
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.phone}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-blue-950 mb-1">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                    }}
                    placeholder="name@example.com"
                    className={`w-full bg-slate-50 border rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none font-medium transition-colors ${
                      fieldErrors.email
                        ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                        : 'border-slate-300 focus:border-indigo-600'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-blue-950 mb-1">SELECT COURSE *</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    if (fieldErrors.courseId) setFieldErrors({ ...fieldErrors, courseId: undefined });
                  }}
                  className={`w-full bg-slate-50 border rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none font-medium transition-colors ${
                    fieldErrors.courseId
                      ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                      : 'border-slate-300 focus:border-indigo-600'
                  }`}
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.duration} - ₹{c.fee.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
                {fieldErrors.courseId && (
                  <p className="mt-1 text-[11px] font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.courseId}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-blue-950 mb-1">MESSAGE / PREFERRED TIMING</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Interested in morning 09:00 AM batch or online live classes..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 resize-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Enrollment Request</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};
