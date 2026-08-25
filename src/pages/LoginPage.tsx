import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword } from '../lib/firebase';
import { apiFetch, setStoredToken } from '../lib/api';
import { User, InstituteBranding } from '../types';
import { fsSubscribeBrandingSettings, DEFAULT_BRANDING } from '../lib/firestoreService';
import { SEO } from '../components/SEO';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigate?: (path: string) => void;
  successMessage?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigate,
  successMessage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bannerMsg, setBannerMsg] = useState(successMessage || '');
  const [branding, setBranding] = useState<InstituteBranding>(DEFAULT_BRANDING);
  const [logoLoadError, setLogoLoadError] = useState(false);

  useEffect(() => {
    const unsub = fsSubscribeBrandingSettings((liveBranding) => {
      setBranding(liveBranding || DEFAULT_BRANDING);
      setLogoLoadError(false);
    });
    return () => unsub();
  }, []);

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your Roll Number / Email Address and Password.');
      return;
    }

    setLoading(true);
    setError('');
    setBannerMsg('');

    const cleanInput = email.trim().toLowerCase();
    const rawPass = password.trim();

    try {
      // 1. Email-based login (Admin & Registered Email students) -> Authenticate with Firebase Auth first
      if (cleanInput.includes('@')) {
        let fbUser;
        try {
          const userCredential = await signInWithEmailAndPassword(auth, cleanInput, rawPass);
          fbUser = userCredential.user;
        } catch (fbLoginErr: any) {
          throw fbLoginErr;
        }

        if (!fbUser) {
          throw new Error('Authentication failed. Please verify your credentials.');
        }

        // Synchronize authenticated Firebase user session
        const syncRes = await apiFetch<{ token: string; user: User }>('/api/auth/firebase-sync', {
          method: 'POST',
          body: JSON.stringify({
            uid: fbUser.uid,
            email: fbUser.email || cleanInput,
            name: fbUser.displayName || (cleanInput === 'rajoritech@gmail.com' ? 'Raj Oritech (Admin)' : ''),
          }),
        });

        if (syncRes.token && syncRes.user) {
          setStoredToken(syncRes.token);
          onLoginSuccess(syncRes.user);
          return;
        }
      } else {
        // 2. Roll Number based student login (e.g. UNI-2026-101)
        const directRes = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: cleanInput, password: rawPass }),
        });
        if (directRes && directRes.user) {
          if (directRes.token) {
            setStoredToken(directRes.token);
          }
          onLoginSuccess(directRes.user);
          return;
        }
      }
    } catch (err: any) {
      let msg = 'Authentication failed. Please check your credentials and password.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid credentials. Please verify your student roll number / email and password.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid login credentials. Please enter a valid registered Roll Number or Email.';
      } else if (err.code === 'auth/user-disabled') {
        msg = 'This account has been disabled. Please contact the institute administrator.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Access temporarily disabled due to multiple failed login attempts. Please try again later.';
      } else if (err.error) {
        msg = err.error;
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your registered email address.');
      return;
    }

    setResetLoading(true);
    setResetError('');

    const cleanResetEmail = resetEmail.trim().toLowerCase();

    try {
      try {
        await sendPasswordResetEmail(auth, cleanResetEmail);
      } catch (sdkErr: any) {
        // Fallback to direct Firebase Auth REST endpoint
        const apiKey = auth.config?.apiKey || 'AIzaSyDqzEkqLvmc_kUhHivls9gY7NXzOmVIGt0';
        const restRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestType: 'PASSWORD_RESET',
              email: cleanResetEmail,
            }),
          }
        );

        if (!restRes.ok) {
          const restData = await restRes.json().catch(() => ({}));
          throw new Error(restData?.error?.message || sdkErr?.message || 'Password reset request failed');
        }
      }

      // Immediately redirect to login screen with success banner and prefilled email
      setEmail(cleanResetEmail);
      setBannerMsg(
        `Password reset instructions have been sent to ${cleanResetEmail}. Check your email to set a new password, then sign in below.`
      );
      setError('');
      setIsForgotPassword(false);
      setResetEmail('');
      setResetError('');
    } catch (err: any) {
      let msg = 'Unable to send password reset email. Please try again.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email address. Please check the spelling.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (err.message) {
        msg = err.message;
      }
      setResetError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const switchToForgotPassword = () => {
    setIsForgotPassword(true);
    setResetEmail(email.trim());
    setResetError('');
    setError('');
  };

  const switchToLogin = () => {
    setIsForgotPassword(false);
    setResetError('');
    setError('');
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-50">
      <SEO
        title="Student & Staff Portal Login"
        description="Sign in to your Oritech Computer student portal to access your enrolled courses, syllabus progress, lecture video player, and certificates."
        path="/login"
        keywords="Oritech student login, student portal, student sign in, admin login"
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-xl shadow-stone-200/50 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!isForgotPassword ? (
            <motion.div
              key="login-view"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                {branding.logoUrl && !logoLoadError ? (
                  <div className="flex justify-center pb-1">
                    <img
                      src={branding.logoUrl}
                      alt={branding.instituteName || 'Institute Logo'}
                      onError={() => setLogoLoadError(true)}
                      className="h-16 sm:h-20 w-auto max-w-[220px] object-contain mx-auto transition-transform hover:scale-102"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md shadow-orange-500/25 border-2 border-amber-300/40">
                    {branding.instituteName ? branding.instituteName.charAt(0).toUpperCase() : 'O'}
                  </div>
                )}
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  Sign In
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Success Banner */}
              {bannerMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3 text-xs font-semibold"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{bannerMsg}</p>
                  </div>
                </motion.div>
              )}

              {/* Error Banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs font-semibold"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleFirebaseLogin} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ORI-2026-100 or student@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={switchToForgotPassword}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-11 pr-11 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:bg-white outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-60 text-white rounded-xl text-sm font-black shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            /* Forgot Password View */
            <motion.div
              key="forgot-password-view"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md border-2 border-amber-300">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  Reset Password
                </h2>
                <p className="text-xs text-stone-500 font-medium leading-relaxed">
                  Enter your registered email address. We will send you a secure link to reset your password and redirect you back to sign in.
                </p>
              </div>

              {/* Reset Error Message */}
              {resetError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs font-semibold"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{resetError}</span>
                </motion.div>
              )}

              <form onSubmit={handleSendPasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. yourname@domain.com"
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-60 text-white rounded-xl text-sm font-black shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {resetLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending Link & Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={switchToLogin}
                  className="w-full py-2.5 text-xs font-black text-stone-600 hover:text-orange-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

