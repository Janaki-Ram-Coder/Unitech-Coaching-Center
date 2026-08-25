import React, { useState, useEffect } from 'react';
import {
  MailCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { auth, sendEmailVerification } from '../lib/firebase';

interface VerifyOtpPageProps {
  email: string;
  onVerificationSuccess: (email: string) => void;
  onNavigate: (path: string) => void;
}

export const VerifyOtpPage: React.FC<VerifyOtpPageProps> = ({
  email,
  onVerificationSuccess,
  onNavigate,
}) => {
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResendEmail = async () => {
    setResending(true);
    setError('');
    setSuccess('');

    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setSuccess('A new verification link has been sent to your email address.');
      } else {
        setSuccess('Verification email sent! Please check your inbox.');
      }
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a moment before trying again.');
      } else {
        setError(err.message || 'Failed to send verification email.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setError('');
    setSuccess('');

    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setSuccess('Your email address is verified! Redirecting to login...');
          setTimeout(() => {
            onVerificationSuccess(email);
          }, 1500);
          return;
        }
      }
      setSuccess('Account created! Please check your inbox for the verification email.');
    } catch (err: any) {
      setError(err.message || 'Error checking verification status.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border-2 border-indigo-100 shadow-xl text-center">
        {/* Header */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-600 font-black flex items-center justify-center mx-auto shadow-sm">
          <MailCheck className="w-9 h-9 text-indigo-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Firebase Email Verification
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            We sent a Firebase verification link to:
          </p>
          <p className="text-sm font-extrabold text-indigo-900 bg-indigo-50 py-1.5 px-3 rounded-xl border border-indigo-200 inline-block">
            {email}
          </p>
        </div>

        {/* Success Banner */}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in text-left">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-shake text-left">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2 text-left">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Firebase Security Setup Active:</span>
          </p>
          <p>
            Check your email inbox and click the verification link to verify your account. Once verified, you can sign in to your student account.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : 'I Have Verified / Continue to Sign In'}</span>
          </button>

          <button
            type="button"
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-300"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>{resending ? 'Sending Email...' : 'Resend Verification Email'}</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Proceed directly to Login &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
