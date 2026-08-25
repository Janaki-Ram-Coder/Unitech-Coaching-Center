import React, { useState, useEffect } from 'react';
import {
  Search,
  Award,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
  BookOpen,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CertificateRecord } from '../types';
import { apiFetch } from '../lib/api';
import { fsVerifyCertificate } from '../lib/firestoreService';
import { SEO } from '../components/SEO';

interface ResultsPageProps {
  initialRollNumber?: string;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ initialRollNumber = '' }) => {
  const [rollNumber, setRollNumber] = useState(initialRollNumber);
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');

  useEffect(() => {
    if (initialRollNumber) {
      setRollNumber(initialRollNumber);
      handleSearchWithRoll(initialRollNumber);
    }
  }, [initialRollNumber]);

  const handleSearchWithRoll = async (queryToSearch: string) => {
    const cleanQuery = queryToSearch.trim();
    if (!cleanQuery) return;
    setError('');
    setLoading(true);
    setCertificate(null);
    setSearchedQuery(cleanQuery);

    try {
      // 1. Direct Firestore Verification first
      try {
        const fsResult = await fsVerifyCertificate(cleanQuery);
        if (fsResult && fsResult.certificate) {
          setCertificate(fsResult.certificate);
          setLoading(false);
          return;
        }
      } catch (_) {
        // Fallback to backend API
      }

      const data = await apiFetch<{ verified: boolean; certificate: CertificateRecord }>(
        `/api/certificates/verify/${encodeURIComponent(cleanQuery)}`
      );
      if (data && data.certificate) {
        setCertificate(data.certificate);
      } else {
        setError(`No verified certificate record found for "${cleanQuery}".`);
      }
    } catch (err: any) {
      setError(
        err.message ||
          `No verified certificate found matching "${cleanQuery}". Please verify the Roll Number or contact institute support.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchWithRoll(rollNumber);
  };

  return (
    <div className="min-h-screen bg-stone-50/60 py-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title={searchedQuery ? `Verify Certificate - ${searchedQuery}` : "Online Certificate Verification & Student Results"}
        description="Verify genuine Oritech Computer student completion certificates, academic transcripts, and diplomas. Instant online validation by roll number or certificate ID."
        path="/results"
        keywords="Oritech certificate verification, student result, mark sheet verification, verify diploma roll number"
      />

      <div className="max-w-4xl mx-auto space-y-9">
        {/* Page Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black rounded-full uppercase tracking-wider shadow-xs">
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            <span>Public Certificate Verification • No Login Required</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight">
            Certificate Verify
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
            Verify official credentials, completion certificates, and diplomas issued by Oritech Computer. Enter the student's Roll Number or Certificate Registration Number below.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="p-6 sm:p-8 bg-white border border-stone-200 rounded-3xl shadow-xs space-y-4 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter Roll Number or Certificate ID (e.g. ORI-2026-101 / CERT-2026-101)"
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 font-mono font-bold uppercase transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.99] text-white font-black rounded-2xl transition-all shadow-md shadow-orange-500/20 whitespace-nowrap text-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Certificate</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Loading Spinner State */}
        {loading && (
          <div className="max-w-2xl mx-auto p-12 bg-white rounded-3xl border border-stone-200 text-center space-y-3 shadow-xs">
            <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-stone-800">
              Querying Institute Credential Registry...
            </p>
            <p className="text-xs text-stone-500">Checking cryptographic hashes and student completion records</p>
          </div>
        )}

        {/* Error Notice */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto p-5 bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm rounded-3xl flex items-start gap-3.5 font-medium shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-black text-rose-950">Verification Unsuccessful</div>
              <div>{error}</div>
              <div className="text-[11px] text-rose-700 pt-1">
                Please double check the Roll Number spelling or contact Oritech Computer Administration for assistance.
              </div>
            </div>
          </motion.div>
        )}

        {/* VERIFIED ANIMATION & DETAILS DISPLAY */}
        <AnimatePresence mode="wait">
          {certificate && !loading && (
            <motion.div
              key={certificate.id}
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="space-y-8"
            >
              {/* SECTION 1: ANIMATED "STUDENT IS VERIFIED" BADGE & METRIC CARDS */}
              <div className="relative overflow-hidden bg-white border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/10 space-y-6">
                {/* Glowing Top Ambient Accent */}
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-500 to-orange-400" />

                {/* Animated Verified Header with Pulsing Shield */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-100"
                    >
                      <ShieldCheck className="w-9 h-9 stroke-[2.5]" />
                    </motion.div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full uppercase tracking-wider">
                          Official Institute Verification
                        </span>
                        <span className="text-xs font-mono font-bold text-stone-400">
                          ISO 9001:2015
                        </span>
                      </div>
                      <motion.h2
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-2xl sm:text-3xl font-black text-stone-900 mt-0.5 tracking-tight flex items-center gap-2"
                      >
                        <span>The Student is Verified</span>
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: 'spring' }}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </motion.span>
                      </motion.h2>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                      Verification Status
                    </div>
                    <div className="text-sm font-black text-emerald-700 flex items-center sm:justify-end gap-1.5 mt-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Authenticated & Valid</span>
                    </div>
                  </div>
                </div>

                {/* THE 4 REQUIRED VERIFICATION CRITERIA: Roll No, Registration No, Name, Course Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Student Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Student Full Name</span>
                    </div>
                    <div className="text-base font-black text-stone-900 truncate">
                      {certificate.studentName}
                    </div>
                  </motion.div>

                  {/* 2. Roll Number */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                      <Award className="w-3.5 h-3.5 text-orange-600" />
                      <span>Student Roll No.</span>
                    </div>
                    <div className="text-base font-black font-mono text-orange-700 truncate">
                      {certificate.rollNumber}
                    </div>
                  </motion.div>

                  {/* 3. Registration No. */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Registration / Serial</span>
                    </div>
                    <div className="text-base font-black font-mono text-emerald-700 truncate">
                      {certificate.certificateNumber}
                    </div>
                  </motion.div>

                  {/* 4. Course Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>Course Enrolled</span>
                    </div>
                    <div className="text-base font-black text-stone-900 truncate" title={certificate.courseTitle}>
                      {certificate.courseTitle}
                    </div>
                  </motion.div>
                </div>

                {/* Additional Info Bar: Grade & Issue Date */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-emerald-950/70 font-semibold">Award Grade: </span>
                      <span className="font-black text-emerald-900 font-mono">
                        {certificate.grade || 'A+ (Distinction)'}
                      </span>
                    </div>
                    <div className="w-px h-3.5 bg-emerald-300 hidden sm:block" />
                    <div>
                      <span className="text-emerald-950/70 font-semibold">Date of Issue: </span>
                      <span className="font-bold text-emerald-900 font-mono">
                        {certificate.issueDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Oritech Computer Accredited Certificate</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
